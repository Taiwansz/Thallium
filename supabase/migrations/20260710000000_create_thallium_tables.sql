-- ======================================================
-- THALLIUM CORE LEDGER DATABASE SCHEMA (SUPABASE/POSTGRES)
-- Migration: 20260710000000_create_thallium_tables.sql
-- ======================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: Clientes (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.clientes (
    id_cliente UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    senha_transacao TEXT, -- Hashed 4-digit PIN (using crypt or frontend hash, here frontend-hashed is fine)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: Contas
CREATE TABLE IF NOT EXISTS public.contas (
    numero_conta SERIAL PRIMARY KEY,
    id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE CASCADE NOT NULL,
    saldo NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (saldo >= 0.00),
    data_abertura DATE DEFAULT current_date NOT NULL,
    tipo_conta TEXT DEFAULT 'Corrente' NOT NULL CHECK (tipo_conta IN ('Corrente', 'Poupança'))
);

-- Set autoincrement start value for numero_conta to look like a real bank account number (e.g., 100000)
ALTER SEQUENCE public.contas_numero_conta_seq RESTART WITH 100001;

-- 3. Table: Transacoes
CREATE TABLE IF NOT EXISTS public.transacoes (
    id_transacao BIGSERIAL PRIMARY KEY,
    numero_conta INT REFERENCES public.contas(numero_conta) ON DELETE CASCADE NOT NULL,
    tipo_transacao TEXT NOT NULL, -- 'Depósito', 'Saque', 'Transferência Enviada', 'Transferência Recebida', 'Pix Enviado', 'Pix Recebido', etc.
    valor NUMERIC(15, 2) NOT NULL, -- Negative for debits, positive for credits
    data_transacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    descricao TEXT,
    categoria TEXT DEFAULT 'Outros' NOT NULL
);

-- 4. Table: Cartoes
CREATE TABLE IF NOT EXISTS public.cartoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(16) UNIQUE NOT NULL,
    validade VARCHAR(5) NOT NULL, -- MM/YY
    cvv VARCHAR(3) NOT NULL,
    id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE CASCADE NOT NULL,
    bloqueado BOOLEAN DEFAULT false NOT NULL,
    limite_total NUMERIC(15, 2) DEFAULT 15000.00 NOT NULL CHECK (limite_total >= 0.00),
    limite_usado NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (limite_usado >= 0.00),
    fatura_fechada BOOLEAN DEFAULT false NOT NULL,
    data_vencimento DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table: ChavesPix
CREATE TABLE IF NOT EXISTS public.chaves_pix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('cpf', 'email', 'aleatoria')),
    chave TEXT UNIQUE NOT NULL,
    id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table: Investimentos
CREATE TABLE IF NOT EXISTS public.investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CDB', 'LCI', 'Tesouro')),
    valor_inicial NUMERIC(15, 2) NOT NULL CHECK (valor_inicial >= 100.00),
    data_aplicacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    taxa_anual NUMERIC(5, 2) DEFAULT 12.00 NOT NULL CHECK (taxa_anual >= 0.00),
    resgatado BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table: Emprestimos
CREATE TABLE IF NOT EXISTS public.emprestimos (
    id_emprestimo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_conta INT REFERENCES public.contas(numero_conta) ON DELETE CASCADE NOT NULL,
    valor_emprestimo NUMERIC(15, 2) NOT NULL CHECK (valor_emprestimo > 0.00),
    juros NUMERIC(5, 2) DEFAULT 5.00 NOT NULL CHECK (juros >= 0.00),
    prazo INT NOT NULL CHECK (prazo > 0), -- months
    data_emprestimo DATE DEFAULT current_date NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'pendente' NOT NULL CHECK (status IN ('pendente', 'aprovado', 'negado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table: AuditLogs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chaves_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Clientes policies
CREATE POLICY "Leitura de perfil próprio" ON public.clientes 
    FOR SELECT USING (auth.uid() = id_cliente);

CREATE POLICY "Atualização de perfil próprio" ON public.clientes 
    FOR UPDATE USING (auth.uid() = id_cliente);

-- Contas policies (read only from client, mutations through secure RPCs)
CREATE POLICY "Leitura de contas próprias" ON public.contas 
    FOR SELECT USING (auth.uid() = id_cliente);

-- Transacoes policies
CREATE POLICY "Leitura de transações próprias" ON public.transacoes 
    FOR SELECT USING (
        numero_conta IN (SELECT numero_conta FROM public.contas WHERE id_cliente = auth.uid())
    );

-- Cartoes policies
CREATE POLICY "Leitura de cartões próprios" ON public.cartoes 
    FOR SELECT USING (auth.uid() = id_cliente);

CREATE POLICY "Atualização de cartões próprios" ON public.cartoes 
    FOR UPDATE USING (auth.uid() = id_cliente);

-- ChavesPix policies
CREATE POLICY "Leitura de chaves Pix próprias" ON public.chaves_pix 
    FOR SELECT USING (auth.uid() = id_cliente);

CREATE POLICY "Inserção de chaves Pix próprias" ON public.chaves_pix 
    FOR INSERT WITH CHECK (auth.uid() = id_cliente);

CREATE POLICY "Exclusão de chaves Pix próprias" ON public.chaves_pix 
    FOR DELETE USING (auth.uid() = id_cliente);

-- Investimentos policies
CREATE POLICY "Leitura de investimentos próprios" ON public.investimentos 
    FOR SELECT USING (auth.uid() = id_cliente);

-- Emprestimos policies
CREATE POLICY "Leitura de empréstimos próprios" ON public.emprestimos 
    FOR SELECT USING (
        numero_conta IN (SELECT numero_conta FROM public.contas WHERE id_cliente = auth.uid())
    );

-- AuditLogs policies
CREATE POLICY "Leitura de logs próprios" ON public.audit_logs 
    FOR SELECT USING (auth.uid() = id_cliente);

-- ======================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================

CREATE INDEX IF NOT EXISTS contas_id_cliente_idx ON public.contas(id_cliente);
CREATE INDEX IF NOT EXISTS transacoes_numero_conta_idx ON public.transacoes(numero_conta);
CREATE INDEX IF NOT EXISTS cartoes_id_cliente_idx ON public.cartoes(id_cliente);
CREATE INDEX IF NOT EXISTS chaves_pix_id_cliente_idx ON public.chaves_pix(id_cliente);
CREATE INDEX IF NOT EXISTS investimentos_id_cliente_idx ON public.investimentos(id_cliente);
CREATE INDEX IF NOT EXISTS emprestimos_numero_conta_idx ON public.emprestimos(numero_conta);
CREATE INDEX IF NOT EXISTS audit_logs_id_cliente_idx ON public.audit_logs(id_cliente);

-- ======================================================
-- TRIGGERS: AUTOMATIC SIGNUP INITIALIZATION
-- ======================================================

CREATE OR REPLACE FUNCTION public.handle_new_cliente()
RETURNS TRIGGER AS $$
DECLARE
  new_cliente_id UUID;
  new_conta_num INT;
  random_balance NUMERIC(15, 2);
  random_card_num VARCHAR(16);
  random_cvv VARCHAR(3);
  random_validade VARCHAR(5);
BEGIN
  -- Insert client profile
  INSERT INTO public.clientes (id_cliente, nome, email, cpf)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'cpf', '00000000000')
  )
  RETURNING id_cliente INTO new_cliente_id;

  -- Generate starting balance R$ 257.00 - R$ 10,380.00
  random_balance := round((257.00 + random() * (10380.00 - 257.00))::numeric, 2);

  -- Create default current account
  INSERT INTO public.contas (id_cliente, saldo, tipo_conta)
  VALUES (new_cliente_id, random_balance, 'Corrente')
  RETURNING numero_conta INTO new_conta_num;

  -- Generate virtual card details
  random_card_num := concat(
    floor(1000 + random() * 9000)::text,
    floor(1000 + random() * 9000)::text,
    floor(1000 + random() * 9000)::text,
    floor(1000 + random() * 9000)::text
  );
  random_cvv := floor(100 + random() * 900)::text;
  random_validade := concat(
    lpad(floor(1 + random() * 12)::text, 2, '0'),
    '/',
    floor(27 + random() * 5)::text
  );

  -- Insert card
  INSERT INTO public.cartoes (numero, validade, cvv, id_cliente, data_vencimento)
  VALUES (random_card_num, random_validade, random_cvv, new_cliente_id, current_date + interval '5 years');

  -- Log signup audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (new_cliente_id, 'Cadastro', 'Conta digital criada automaticamente na abertura de conta.');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_cliente();

-- ======================================================
-- SECURE TRANSACTIONAL PROCEDURES (RPCs) - RESOLVED BY auth.uid()
-- ======================================================

-- 1. RPC: Deposit funds
CREATE OR REPLACE FUNCTION public.realizar_deposito(
  p_valor NUMERIC(15, 2),
  p_descricao TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor do depósito deve ser positivo.';
  END IF;

  SELECT numero_conta INTO v_num_conta FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  -- Add balance
  UPDATE public.contas SET saldo = saldo + p_valor WHERE numero_conta = v_num_conta;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Depósito', p_valor, p_descricao, 'Depósitos');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Depósito', concat('Realizado depósito de R$ ', p_valor::text));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: Withdraw funds
CREATE OR REPLACE FUNCTION public.realizar_saque(
  p_valor NUMERIC(15, 2),
  p_descricao TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_saldo NUMERIC(15, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor do saque deve ser positivo.';
  END IF;

  SELECT numero_conta, saldo INTO v_num_conta, v_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Deduct balance
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_num_conta;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Saque', -p_valor, p_descricao, 'Saques');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Saque', concat('Realizado saque de R$ ', p_valor::text));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: Transfer funds (email-based)
CREATE OR REPLACE FUNCTION public.transferir_dinheiro(
  p_destinatario_email TEXT,
  p_valor NUMERIC(15, 2),
  p_descricao TEXT,
  p_categoria TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_remetente_conta INT;
  v_remetente_saldo NUMERIC(15, 2);
  v_remetente_nome TEXT;
  v_destinatario_id UUID;
  v_destinatario_conta INT;
  v_destinatario_nome TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor da transferência deve ser positivo.';
  END IF;

  -- Remetente check
  SELECT numero_conta, saldo INTO v_remetente_conta, v_remetente_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  SELECT nome INTO v_remetente_nome FROM public.clientes WHERE id_cliente = v_user_id;
  IF v_remetente_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do remetente não encontrada.';
  END IF;

  IF v_remetente_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Destinatario check
  SELECT id_cliente, nome INTO v_destinatario_id, v_destinatario_nome FROM public.clientes WHERE email = p_destinatario_email;
  IF v_destinatario_id IS NULL THEN
    RAISE EXCEPTION 'Destinatário não encontrado.';
  END IF;

  IF v_destinatario_id = v_user_id THEN
    RAISE EXCEPTION 'Não é possível transferir para si mesmo.';
  END IF;

  SELECT numero_conta INTO v_destinatario_conta FROM public.contas WHERE id_cliente = v_destinatario_id LIMIT 1;
  IF v_destinatario_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do destinatário não encontrada.';
  END IF;

  -- Execute transfer
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_remetente_conta;
  UPDATE public.contas SET saldo = saldo + p_valor WHERE numero_conta = v_destinatario_conta;

  -- Record transactions
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_remetente_conta, 'Transferência Enviada', -p_valor, concat('Para ', v_destinatario_nome, ': ', p_descricao), p_categoria);

  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_destinatario_conta, 'Transferência Recebida', p_valor, concat('De ', v_remetente_nome, ': ', p_descricao), 'Transferência');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Transferência', concat('Enviado R$ ', p_valor::text, ' para ', p_destinatario_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Realizar PIX (Key-based)
CREATE OR REPLACE FUNCTION public.realizar_pix(
  p_chave_pix TEXT,
  p_valor NUMERIC(15, 2)
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_remetente_conta INT;
  v_remetente_saldo NUMERIC(15, 2);
  v_remetente_nome TEXT;
  v_destinatario_id UUID;
  v_destinatario_conta INT;
  v_destinatario_nome TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor do Pix deve ser positivo.';
  END IF;

  -- Remetente check
  SELECT numero_conta, saldo INTO v_remetente_conta, v_remetente_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  SELECT nome INTO v_remetente_nome FROM public.clientes WHERE id_cliente = v_user_id;
  IF v_remetente_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do remetente não encontrada.';
  END IF;

  IF v_remetente_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Pix Key check
  SELECT id_cliente INTO v_destinatario_id FROM public.chaves_pix WHERE chave = p_chave_pix;
  IF v_destinatario_id IS NULL THEN
    RAISE EXCEPTION 'Chave Pix não encontrada.';
  END IF;

  IF v_destinatario_id = v_user_id THEN
    RAISE EXCEPTION 'Não é possível transferir para si mesmo.';
  END IF;

  SELECT numero_conta INTO v_destinatario_conta FROM public.contas WHERE id_cliente = v_destinatario_id LIMIT 1;
  SELECT nome INTO v_destinatario_nome FROM public.clientes WHERE id_cliente = v_destinatario_id;
  IF v_destinatario_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do destinatário não encontrada.';
  END IF;

  -- Execute transfer
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_remetente_conta;
  UPDATE public.contas SET saldo = saldo + p_valor WHERE numero_conta = v_destinatario_conta;

  -- Record transactions
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_remetente_conta, 'Pix Enviado', -p_valor, concat('Para ', v_destinatario_nome, ' (Chave: ', p_chave_pix, ')'), 'Transferência');

  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_destinatario_conta, 'Pix Recebido', p_valor, concat('De ', v_remetente_nome, ' (Via Pix)'), 'Transferência');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Pix', concat('Pix de R$ ', p_valor::text, ' enviado para chave ', p_chave_pix));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: Pay Card Invoice
CREATE OR REPLACE FUNCTION public.pagar_fatura(
  p_id_cartao UUID,
  p_valor NUMERIC(15, 2)
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_saldo NUMERIC(15, 2);
  v_cartao_numero VARCHAR(16);
  v_limite_usado NUMERIC(15, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  -- Verify card
  SELECT numero, limite_usado INTO v_cartao_numero, v_limite_usado FROM public.cartoes WHERE id = p_id_cartao AND id_cliente = v_user_id;
  IF v_cartao_numero IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado.';
  END IF;

  IF p_valor <= 0 OR p_valor > v_limite_usado THEN
    RAISE EXCEPTION 'Valor de pagamento inválido.';
  END IF;

  -- Verify account
  SELECT numero_conta, saldo INTO v_num_conta, v_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente na conta corrente.';
  END IF;

  -- Process payments
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_num_conta;
  UPDATE public.cartoes SET limite_usado = limite_usado - p_valor WHERE id = p_id_cartao;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Pagamento Fatura', -p_valor, concat('Pagamento Cartão final ', right(v_cartao_numero, 4)), 'Pagamentos');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Cartões', concat('Pagamento da fatura no valor de R$ ', p_valor::text));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: Invest funds
CREATE OR REPLACE FUNCTION public.investir_recursos(
  p_tipo TEXT,
  p_valor NUMERIC(15, 2)
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_saldo NUMERIC(15, 2);
  v_taxa NUMERIC(5, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor < 100.00 THEN
    RAISE EXCEPTION 'Valor mínimo de R$ 100,00.';
  END IF;

  -- Verify account
  SELECT numero_conta, saldo INTO v_num_conta, v_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Map simulated rate
  IF p_tipo = 'CDB' THEN
    v_taxa := 12.50;
  ELSIF p_tipo = 'LCI' THEN
    v_taxa := 11.20;
  ELSE
    v_taxa := 10.80; -- Tesouro Direto
  END IF;

  -- Process investment
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_num_conta;

  INSERT INTO public.investimentos (id_cliente, tipo, valor_inicial, taxa_anual)
  VALUES (v_user_id, p_tipo, p_valor, v_taxa);

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Aplicação', -p_valor, concat('Investimento em ', p_tipo), 'Investimentos');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Investimentos', concat('Investido R$ ', p_valor::text, ' em ', p_tipo));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC: Redeem investment
CREATE OR REPLACE FUNCTION public.resgatar_investimento(
  p_id_investimento UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_valor_inicial NUMERIC(15, 2);
  v_taxa_anual NUMERIC(5, 2);
  v_data_aplicacao TIMESTAMP WITH TIME ZONE;
  v_resgatado BOOLEAN;
  v_tipo TEXT;
  v_dias_corridos INT;
  v_taxa_diaria NUMERIC(12, 9);
  v_rendimento NUMERIC(15, 2);
  v_valor_final NUMERIC(15, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  -- Verify investment
  SELECT valor_inicial, taxa_anual, data_aplicacao, resgatado, tipo 
  INTO v_valor_inicial, v_taxa_anual, v_data_aplicacao, v_resgatado, v_tipo
  FROM public.investimentos WHERE id = p_id_investimento AND id_cliente = v_user_id;

  IF v_valor_inicial IS NULL THEN
    RAISE EXCEPTION 'Investimento não encontrado.';
  END IF;

  IF v_resgatado = true THEN
    RAISE EXCEPTION 'Investimento já resgatado.';
  END IF;

  SELECT numero_conta INTO v_num_conta FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  -- Calculate yield
  v_dias_corridos := EXTRACT(DAY FROM (now() - v_data_aplicacao));
  IF v_dias_corridos < 0 THEN
    v_dias_corridos := 0;
  END IF;
  
  v_taxa_diaria := (v_taxa_anual / 100.00) / 365.00;
  v_rendimento := round((v_valor_inicial * (v_taxa_diaria * v_dias_corridos))::numeric, 2);
  v_valor_final := v_valor_inicial + v_rendimento;

  -- Process redemption
  UPDATE public.investimentos SET resgatado = true WHERE id = p_id_investimento;
  UPDATE public.contas SET saldo = saldo + v_valor_final WHERE numero_conta = v_num_conta;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Resgate', v_valor_final, concat('Resgate de ', v_tipo), 'Investimentos');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Investimentos', concat('Resgatado R$ ', v_valor_final::text, ' de ', v_tipo, ' (Rendimentos: R$ ', v_rendimento::text, ')'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. RPC: Request loan
CREATE OR REPLACE FUNCTION public.solicitar_emprestimo(
  p_valor NUMERIC(15, 2),
  p_prazo INT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_data_vencimento DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor do empréstimo inválido.';
  END IF;

  IF p_prazo <= 0 THEN
    RAISE EXCEPTION 'Prazo inválido.';
  END IF;

  SELECT numero_conta INTO v_num_conta FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  v_data_vencimento := current_date + (p_prazo || ' months')::interval;

  -- Insert Loan in pending status
  INSERT INTO public.emprestimos (numero_conta, valor_emprestimo, prazo, data_vencimento, status)
  VALUES (v_num_conta, p_valor, p_prazo, v_data_vencimento, 'pendente');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Empréstimos', concat('Solicitação de empréstimo no valor de R$ ', p_valor::text, ' em ', p_prazo::text, ' parcelas.'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. RPC: Boleto Payment
CREATE OR REPLACE FUNCTION public.pagar_boleto(
  p_valor NUMERIC(15, 2),
  p_cod_barras TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_saldo NUMERIC(15, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor do boleto deve ser positivo.';
  END IF;

  SELECT numero_conta, saldo INTO v_num_conta, v_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente na conta corrente.';
  END IF;

  -- Deduct balance
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_num_conta;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Pagamento Boleto', -p_valor, concat('Pagamento Boleto: ', p_cod_barras), 'Pagamentos');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Pagamentos', concat('Pagamento de boleto no valor de R$ ', p_valor::text));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. RPC: Mobile Recharge
CREATE OR REPLACE FUNCTION public.realizar_recarga(
  p_valor NUMERIC(15, 2),
  p_operadora TEXT,
  p_telefone TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_num_conta INT;
  v_saldo NUMERIC(15, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor da recarga deve ser positivo.';
  END IF;

  SELECT numero_conta, saldo INTO v_num_conta, v_saldo FROM public.contas WHERE id_cliente = v_user_id LIMIT 1;
  IF v_num_conta IS NULL THEN
    RAISE EXCEPTION 'Conta do cliente não encontrada.';
  END IF;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente.';
  END IF;

  -- Deduct balance
  UPDATE public.contas SET saldo = saldo - p_valor WHERE numero_conta = v_num_conta;

  -- Record transaction
  INSERT INTO public.transacoes (numero_conta, tipo_transacao, valor, descricao, categoria)
  VALUES (v_num_conta, 'Recarga Celular', -p_valor, concat('Recarga ', p_operadora, ' - ', p_telefone), 'Telefonia');

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Recarga', concat('Recarga de R$ ', p_valor::text, ' realizada para o número ', p_telefone));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11. RPC: Configure Transaction PIN
CREATE OR REPLACE FUNCTION public.configurar_senha_transacao(
  p_pin_hashed TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  UPDATE public.clientes SET senha_transacao = p_pin_hashed WHERE id_cliente = v_user_id;

  -- Log audit
  INSERT INTO public.audit_logs (id_cliente, action, details)
  VALUES (v_user_id, 'Segurança', 'Senha de transação configurada ou atualizada.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 12. RPC: Verify Transaction PIN
CREATE OR REPLACE FUNCTION public.verificar_pin_transacao(
  p_pin_hashed TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_match BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT (senha_transacao = p_pin_hashed) INTO v_match FROM public.clientes WHERE id_cliente = v_user_id;
  RETURN COALESCE(v_match, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

