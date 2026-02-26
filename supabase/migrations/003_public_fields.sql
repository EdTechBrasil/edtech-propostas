-- ─────────────────────────────────────────────────────────────────────────────
-- EdTech Propostas — Migration: Campos numéricos de público na tabela propostas
-- ─────────────────────────────────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase dashboard.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_escolas     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_alunos      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_professores INTEGER NOT NULL DEFAULT 0;
