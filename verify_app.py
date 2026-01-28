import random
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Login Page
    print("Visiting Login Page...")
    page.goto("http://127.0.0.1:5000/")
    page.screenshot(path="login.png")

    # Register Page
    print("Visiting Register Page...")
    page.click("text=Cadastre-se")
    page.wait_for_url("**/cadastro")
    page.screenshot(path="register.png")

    # Register User
    print("Registering User...")
    # Generate random user
    rand_suffix = str(random.randint(1000, 9999))
    name = f"User {rand_suffix}"
    email = f"user{rand_suffix}@example.com"
    cpf = f"123456{rand_suffix}" # Simplified CPF
    password = "password123"

    page.fill("#name", name)
    page.fill("#register-email", email)
    page.fill("#cpf", cpf)
    page.fill("#register-password", password)

    # Handle dialog
    def handle_dialog(dialog):
        print(f"Dialog message: {dialog.message}")
        dialog.dismiss()

    page.on("dialog", handle_dialog)

    page.click("button[type='submit']")
    # Wait for processing (fetch)
    page.wait_for_timeout(2000)

    # Login
    print("Logging in...")
    page.goto("http://127.0.0.1:5000/login")
    page.fill("#email", email)
    page.fill("#password", password)
    page.click("button[type='submit']")
    page.wait_for_url("**/index")
    page.screenshot(path="dashboard.png")

    # Other Pages
    pages = [
        ("extrato", "extrato.png"),
        ("transfer", "transfer.png"),
        ("historico", "historico.png"),
        ("boleto", "boleto.png"),
        ("deposito", "deposito.png"),
        ("saque", "saque.png"),
        ("cartoes", "cartoes.png"),
        ("emprestimo", "emprestimo.png")
    ]

    for route, img_name in pages:
        print(f"Visiting {route}...")
        try:
            page.goto(f"http://127.0.0.1:5000/{route}")
            page.screenshot(path=img_name)
        except Exception as e:
            print(f"Error visiting {route}: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
