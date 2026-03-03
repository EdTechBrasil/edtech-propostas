-- Migration 008: novo tipo PorAlunoEProfessorXTema
-- Quantidade = (alunos + professores) × temas
-- Execute no Supabase SQL Editor

-- Passo 1: adicionar ao enum
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorAlunoEProfessorXTema';

-- Passo 2: atualizar os 3 livros do "Meu Primeiro Código"
UPDATE produto_componentes
SET tipo_calculo = 'PorAlunoEProfessorXTema'
WHERE nome IN ('Livro Ilustrado', 'Livro de Desafios', 'Livro de Atividades')
  AND tipo_calculo = 'PorAlunoXTema';
