-- Migration: Wizard "Proposta por Orçamento"
-- ⚠️  DDL — rodar manualmente no Supabase SQL Editor

-- 1. Adicionar colunas à tabela propostas
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS tolerancia_percent NUMERIC(5,2) DEFAULT 2,
  ADD COLUMN IF NOT EXISTS objetivo TEXT DEFAULT 'BaterOrcamento';

-- 2. Adicionar coluna tipo à tabela produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS tipo TEXT;
