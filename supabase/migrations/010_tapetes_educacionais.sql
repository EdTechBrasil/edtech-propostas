-- Migration 010: Tapetes Educacionais para Meu Primeiro Código
-- Execute no Supabase SQL Editor em 2 partes separadas

-- ────────────────────────────────────────────────────────────────────
-- BATCH 1: DDL (rodar primeiro e aguardar commit)
-- ────────────────────────────────────────────────────────────────────

ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'TapetePreI';
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'TapetePreII';
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'Tapete1a3';

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS series_tapetes TEXT DEFAULT NULL;

-- ────────────────────────────────────────────────────────────────────
-- BATCH 2: DML (rodar separado após BATCH 1 ser commitado)
-- ────────────────────────────────────────────────────────────────────

-- Fórmula: tapetes × num_temas × (num_escolas × num_kits)
--   Pré I        →  9 tapetes
--   Pré II       → 12 tapetes
--   1º ao 3º ano → 16 tapetes

INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - Pré I', 'Kit', 'TapetePreI', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - Pré I'
  );

INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - Pré II', 'Kit', 'TapetePreII', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - Pré II'
  );

INSERT INTO produto_componentes
  (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base, ativo)
SELECT p.id, 'Tapetes - 1º ao 3º ano', 'Kit', 'Tapete1a3', false, 0, 0, true
FROM produtos p
WHERE p.nome ILIKE '%Primeiro%' AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM produto_componentes pc
    WHERE pc.produto_id = p.id AND pc.nome = 'Tapetes - 1º ao 3º ano'
  );
