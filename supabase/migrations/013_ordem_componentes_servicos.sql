-- Adiciona coluna `ordem` nas tabelas de catálogo de componentes e serviços
-- Permite reordenar itens via drag-and-drop na tela de Componentes da proposta
-- ATENÇÃO: rodar em 2 execuções separadas no Supabase SQL Editor

-- Execução 1: DDL
ALTER TABLE produto_componentes ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE produto_servicos     ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Execução 2: Inicializar ordem com base no nome dentro de cada produto
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY produto_id ORDER BY nome) AS rn
  FROM produto_componentes
)
UPDATE produto_componentes SET ordem = ranked.rn FROM ranked WHERE produto_componentes.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY produto_id ORDER BY nome) AS rn
  FROM produto_servicos
)
UPDATE produto_servicos SET ordem = ranked.rn FROM ranked WHERE produto_servicos.id = ranked.id;
