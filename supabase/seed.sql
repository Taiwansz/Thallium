-- ======================================================
-- THALLIUM DATABASE SEED FILE
-- File: seed.sql
-- ======================================================

-- Seeds are not strictly required since our trigger handle_new_cliente()
-- automatically provisions a client profile, current account with balance,
-- and virtual credit card upon Supabase Auth sign-up.

-- You can use this file in the SQL Editor to insert mock transactions
-- or check structure logic.

-- Example Query to inspect audit logs:
-- SELECT * FROM public.audit_logs ORDER BY timestamp DESC;

-- Example Query to inspect ledger consistency:
-- SELECT c.numero_conta, cl.nome, c.saldo, COALESCE(SUM(t.valor), 0) as sum_transactions
-- FROM public.contas c
-- JOIN public.clientes cl ON cl.id_cliente = c.id_cliente
-- LEFT JOIN public.transacoes t ON t.numero_conta = c.numero_conta
-- GROUP BY c.numero_conta, cl.nome, c.saldo;
