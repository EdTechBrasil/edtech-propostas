-- Campos narrativos para a etapa de Apresentação da proposta
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS apresentacao_titulo        TEXT,
  ADD COLUMN IF NOT EXISTS apresentacao_introducao    TEXT,
  ADD COLUMN IF NOT EXISTS apresentacao_objetivos     JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS apresentacao_solucoes      JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS apresentacao_cronograma    JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS apresentacao_termos        TEXT;
