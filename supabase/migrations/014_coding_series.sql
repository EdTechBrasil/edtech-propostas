-- Migration 014: Coding — Séries 4º ao 9º ano e componentes
-- Execute no Supabase SQL Editor

-- ────────────────────────────────────────────────────────────────────
-- BATCH 1: DDL (rodar primeiro, manualmente no SQL Editor)
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_alunos_ano4 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano5 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano6 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano7 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano8 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano9 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano4  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano5  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano6  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano7  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano8  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano9  INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────
-- BATCH 2: DML — rodar via scripts/run-migration-014.mjs
-- ────────────────────────────────────────────────────────────────────

-- Adicionar componentes ao produto Coding
INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT id, 'Livros dos Alunos', 'Livro', 'PorAlunoXTema', TRUE, 0, 0, TRUE
FROM produtos WHERE nome ILIKE '%Coding%'
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = produtos.id AND pc.nome = 'Livros dos Alunos'
  );

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT id, 'Livros do Professor', 'Livro', 'PorProfessor', TRUE, 0, 0, TRUE
FROM produtos WHERE nome ILIKE '%Coding%'
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = produtos.id AND pc.nome = 'Livros do Professor'
  );

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT id, 'Licença da Plataforma', 'Plataforma', 'PorProfessor', FALSE, 0, 0, TRUE
FROM produtos WHERE nome ILIKE '%Coding%'
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = produtos.id AND pc.nome = 'Licença da Plataforma'
  );

-- Atualizar valores de formação do Coding
UPDATE produto_servicos SET valor_venda_base = 1149.40
WHERE produto_id = (SELECT id FROM produtos WHERE nome ILIKE '%Coding%')
  AND nome ILIKE '%presencial%';

UPDATE produto_servicos SET valor_venda_base = 750.00
WHERE produto_id = (SELECT id FROM produtos WHERE nome ILIKE '%Coding%')
  AND nome ILIKE '%ead%';

UPDATE produto_servicos SET valor_venda_base = 1119.40
WHERE produto_id = (SELECT id FROM produtos WHERE nome ILIKE '%Coding%')
  AND nome ILIKE '%assessoria%';
