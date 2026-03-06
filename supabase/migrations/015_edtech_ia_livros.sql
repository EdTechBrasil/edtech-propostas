-- Migration 015: Edtech IA — Livros de Conceitos e Práticas Digitais
-- Execute no Supabase SQL Editor

-- ────────────────────────────────────────────────────────────────────
-- BATCH 1: DDL (rodar primeiro, manualmente no SQL Editor)
-- ────────────────────────────────────────────────────────────────────

ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorAlunoEProfessorXLivroConceitos';
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorAlunoEProfessorXLivroPraticas';

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_livros_conceitos INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS num_livros_praticas  INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────
-- BATCH 2: DML — rodar via scripts/run-migration-015.mjs
-- ────────────────────────────────────────────────────────────────────

-- Desativar componente genérico antigo
UPDATE produto_componentes SET ativo = false
WHERE produto_id = (SELECT id FROM produtos WHERE nome = 'Edtech IA')
  AND nome = 'Kit de Software/Hardware IA';

-- Adicionar componentes corretos
INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo, ordem)
SELECT id, 'Livros de Conceitos', 'Livro', 'PorAlunoEProfessorXLivroConceitos', TRUE, 160.00, 0, TRUE, 1
FROM produtos WHERE nome = 'Edtech IA'
  AND NOT EXISTS (SELECT 1 FROM produto_componentes pc WHERE pc.produto_id = produtos.id AND pc.nome = 'Livros de Conceitos');

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo, ordem)
SELECT id, 'Livros de Práticas Digitais', 'Livro', 'PorAlunoEProfessorXLivroPraticas', FALSE, 240.00, 0, TRUE, 2
FROM produtos WHERE nome = 'Edtech IA'
  AND NOT EXISTS (SELECT 1 FROM produto_componentes pc WHERE pc.produto_id = produtos.id AND pc.nome = 'Livros de Práticas Digitais');

-- Atualizar valores de formação
UPDATE produto_servicos SET valor_venda_base = 750.00
WHERE produto_id = (SELECT id FROM produtos WHERE nome = 'Edtech IA') AND nome ILIKE '%ead%';

UPDATE produto_servicos SET valor_venda_base = 1119.40
WHERE produto_id = (SELECT id FROM produtos WHERE nome = 'Edtech IA') AND nome ILIKE '%assessoria%';
