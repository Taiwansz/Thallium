from models import Cliente, Conta

def test_index_redirect(client):
    response = client.get('/', follow_redirects=True)
    assert b'Login' in response.data

def test_register_login_flow(client, auth, app):
    # Register
    response = auth.register()
    assert b'Conta criada com sucesso' in response.data or b'Login' in response.data

    with app.app_context():
        assert Cliente.query.count() == 1
        assert Conta.query.count() == 1

    # Login
    response = auth.login(password='password123')
    assert b'Oi, Tester' in response.data

    # Check Balance (should be 0)
    assert b'R$ 0,00' in response.data

def test_deposit_and_transfer(client, auth, app):
    # Register User 1
    resp = auth.register(nome='User1', cpf='11111111111', email='u1@test.com', password='password123', confirm_password='password123')
    assert b'Conta criada com sucesso' in resp.data
    auth.logout()

    # Register User 2
    resp = auth.register(nome='User2', cpf='22222222222', email='u2@test.com', password='password123', confirm_password='password123')
    assert b'Conta criada com sucesso' in resp.data

    # Login User 1
    resp = auth.login(email='u1@test.com', password='password123')
    assert b'Oi, User1' in resp.data

    # Deposit
    response = client.post('/deposito', data={'amount': '100.00'}, follow_redirects=True)
    assert b'Dep\xc3\xb3sito realizado com sucesso' in response.data or b'sucesso' in response.data

    # Check Balance
    response = client.get('/index')
    assert b'100,00' in response.data

    # Transfer to User 2
    response = client.post('/transfer', data={
        'recipient_email': 'u2@test.com',
        'amount': '50.00',
        'description': 'Test Transfer'
    }, follow_redirects=True)

    assert b'Transfer\xc3\xaancia realizada com sucesso' in response.data or b'sucesso' in response.data

    # Check Balance User 1 (should be 50)
    response = client.get('/index')
    assert b'50,00' in response.data

    auth.logout()

    # Login User 2 and check balance (should be 50)
    auth.login(email='u2@test.com', password='password123')
    response = client.get('/index')
    assert b'50,00' in response.data
