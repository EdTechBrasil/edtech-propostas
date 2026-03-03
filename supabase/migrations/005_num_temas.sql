-- Adiciona campo num_temas na tabela propostas
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_temas INTEGER NOT NULL DEFAULT 0;
