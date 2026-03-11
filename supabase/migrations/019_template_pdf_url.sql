-- Migration 019: Add template_pdf_url column to configuracao_pdf
-- ⚠️ DDL — rodar manualmente no SQL Editor do Supabase

ALTER TABLE configuracao_pdf ADD COLUMN IF NOT EXISTS template_pdf_url TEXT;
