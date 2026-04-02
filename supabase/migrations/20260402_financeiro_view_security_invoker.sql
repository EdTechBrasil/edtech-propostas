-- Mantém security_invoker = false (padrão) na view proposta_financeiro
-- Com false, a view roda com permissões do owner (postgres), bypassando RLS nas tabelas internas
-- Isso garante que o cálculo financeiro sempre retorna dados corretos independente do perfil do usuário

ALTER VIEW proposta_financeiro SET (security_invoker = false);
