CREATE SCHEMA thalium;
-- Certifique-se de estar utilizando o banco Thalium
USE thalium;

DROP USER IF EXISTS 'tester6'@'localhost';

-- Criar um novo usuário
CREATE USER 'tester6'@'localhost' IDENTIFIED BY '1233';

-- Conceder todas as permissões para o novo usuário no banco de dados 'thalium'
GRANT ALL PRIVILEGES ON thalium.* TO 'tester6'@'localhost';
FLUSH PRIVILEGES; -- Aplicar as mudanças de privilégios

-- Criação da tabela de Clientes
CREATE TABLE Clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    cpf VARCHAR(11) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- Criação da tabela de Contas
CREATE TABLE Contas (
    numero_conta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    saldo DECIMAL(15, 2) DEFAULT 0.00,
    data_abertura DATE NOT NULL,
    tipo_conta ENUM('Corrente', 'Poupança') NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
);

-- Criação da tabela de Transações
CREATE TABLE Transacoes (
    id_transacao INT AUTO_INCREMENT PRIMARY KEY,
    numero_conta INT,
    tipo_transacao ENUM('Depósito', 'Saque', 'Transferência,Pix Enviar') NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descricao VARCHAR(255),
    FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
);

-- Criação da tabela de Empréstimos
CREATE TABLE Emprestimos (
    id_emprestimo INT AUTO_INCREMENT PRIMARY KEY,
    numero_conta INT,
    valor_emprestimo DECIMAL(15, 2) NOT NULL,
    juros DECIMAL(5, 2) NOT NULL,
    prazo INT NOT NULL, -- prazo em meses
    data_emprestimo DATE NOT NULL,
    data_vencimento DATE NOT NULL, -- Adicionando a data de vencimento
    status ENUM('pendente', 'aprovado', 'negado') DEFAULT 'pendente', -- Status do empréstimo
    FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
);


-- Criação da tabela de Histórico de Transações
CREATE TABLE Historico_Transacoes (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    numero_conta INT,
    tipo_transacao VARCHAR(255),
    valor DECIMAL(15, 2) NOT NULL,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descricao VARCHAR(255),
    FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE
);
    
CREATE TABLE cartoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(16) NOT NULL UNIQUE,      
    validade VARCHAR(5) NOT NULL,            
    cvv VARCHAR(3) NOT NULL,              
    id_cliente INT NOT NULL,                
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) 
);



