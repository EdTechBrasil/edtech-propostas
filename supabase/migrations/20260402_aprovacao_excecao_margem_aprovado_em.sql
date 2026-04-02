-- Adiciona coluna aprovado_em à tabela aprovacao_excecao_margem
-- O código em aprovacao.ts já usa essa coluna para registrar quando a aprovação foi concedida

ALTER TABLE aprovacao_excecao_margem
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;
