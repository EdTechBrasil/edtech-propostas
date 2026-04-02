-- Garante que a view proposta_financeiro aplica RLS do usuário autenticado (security_invoker)
-- Sem isso, em Supabase/PG15+, a view pode rodar com permissões do owner e ignorar RLS

ALTER VIEW proposta_financeiro SET (security_invoker = true);
