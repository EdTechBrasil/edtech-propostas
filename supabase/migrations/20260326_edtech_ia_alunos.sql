-- Adiciona campo separado para alunos do EdTech IA
-- Evita conflito com num_alunos global (soma de todas as séries)
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS num_alunos_edtech_ia INTEGER NOT NULL DEFAULT 0;
