-- Adiciona num_alunos em proposta_produtos para produtos do tipo PorAluno (ex: Codmos, Seppo)
-- Permite informar contagem de usuários por produto separado de num_escolas
ALTER TABLE proposta_produtos ADD COLUMN IF NOT EXISTS num_alunos INTEGER NOT NULL DEFAULT 0;
