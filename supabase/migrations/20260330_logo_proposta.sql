-- Adiciona logo própria por proposta
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS logo_url TEXT;
