-- Migration 011: Séries por Aluno e Temas por Série
-- Execute no Supabase SQL Editor em 2 partes separadas

-- ────────────────────────────────────────────────────────────────────
-- BATCH 1: DDL (rodar primeiro e aguardar commit)
-- ────────────────────────────────────────────────────────────────────

ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'TapeteAno1';
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'TapeteAno2';
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'TapeteAno3';

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_alunos_pre_i  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_pre_ii INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano1   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano2   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos_ano3   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_pre_i   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_pre_ii  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano1    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano2    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_temas_ano3    INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────
-- BATCH 2: DML (rodar APÓS BATCH 1 ser commitado)
-- ────────────────────────────────────────────────────────────────────

-- Inserir novos componentes de tapete por série individual (1ª, 2ª, 3ª série)
INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - 1ª série', 'Kit', 'TapeteAno1', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - 1ª série'
  );

INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - 2ª série', 'Kit', 'TapeteAno2', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - 2ª série'
  );

INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - 3ª série', 'Kit', 'TapeteAno3', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - 3ª série'
  );

-- Desabilitar componente Tapete1a3 (substituído pelos 3 componentes individuais)
UPDATE produto_componentes
SET ativo = false
WHERE nome = 'Tapetes - 1º ao 3º ano' AND tipo_calculo = 'Tapete1a3';
