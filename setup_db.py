import sqlite3
import os

DB_NAME = 'thalium.db'

def setup_database():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Create Tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Clientes (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        cpf TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Contas (
        numero_conta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER,
        saldo REAL DEFAULT 0.00,
        data_abertura DATE NOT NULL,
        tipo_conta TEXT NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Transacoes (
        id_transacao INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        tipo_transacao TEXT NOT NULL,
        valor REAL NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        descricao TEXT,
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Emprestimos (
        id_emprestimo INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        valor_emprestimo REAL NOT NULL,
        juros REAL NOT NULL,
        prazo INTEGER NOT NULL,
        data_emprestimo DATE NOT NULL,
        data_vencimento DATE NOT NULL,
        status TEXT DEFAULT 'pendente',
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Historico_Transacoes (
        id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_conta INTEGER,
        tipo_transacao TEXT,
        valor REAL NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        descricao TEXT,
        FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cartoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        validade TEXT NOT NULL,
        cvv TEXT NOT NULL,
        id_cliente INTEGER NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
    );
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    setup_database()
