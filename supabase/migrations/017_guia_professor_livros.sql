-- Adiciona coluna num_livros_guia à tabela propostas
-- Representa quantos volumes do Guia do Professor estão na proposta
-- Fórmula do Guia: num_professores × num_temas × num_livros_guia

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_livros_guia integer NOT NULL DEFAULT 1;
