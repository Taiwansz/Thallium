import sqlite3

def init_db():
    connection = sqlite3.connect('thalium.db')
    cursor = connection.cursor()

    # Clientes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Clientes (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        cpf TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    )
    ''')

    # Contas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Contas (
        numero_conta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER,
        saldo REAL DEFAULT 0.00,
        data_abertura TEXT NOT NULL,
        tipo_conta TEXT NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
    )
    ''')

    # Transacoes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Transacoes (
        id_transacao INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        tipo_transacao TEXT NOT NULL,
        valor REAL NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        descricao TEXT,
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    )
    ''')

    # Emprestimos
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Emprestimos (
        id_emprestimo INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        valor_emprestimo REAL NOT NULL,
        juros REAL NOT NULL,
        prazo INTEGER NOT NULL,
        data_emprestimo TEXT NOT NULL,
        data_vencimento TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    )
    ''')

    # Historico_Transacoes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Historico_Transacoes (
        id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        tipo_transacao TEXT,
        valor REAL NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        descricao TEXT,
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    )
    ''')

    # cartoes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cartoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        validade TEXT NOT NULL,
        cvv TEXT NOT NULL,
        id_cliente INTEGER NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
    )
    ''')

    connection.commit()
    connection.close()
    print("Database thalium.db created successfully.")

if __name__ == '__main__':
    init_db()
