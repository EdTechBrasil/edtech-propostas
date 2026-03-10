-- Migration 016: Corrige tipo_calculo dos livros do MPC
-- Migration 008 alterou para PorAlunoEProfessorXTema, mas a fórmula correta
-- é PorAlunoXTema (que usa totalAlunoXTema = sum(alunos_série × temas_série) no servidor).
-- PorAlunoEProfessorXTema inclui professores e usa numTemas_max (errado para livros de aluno).

UPDATE produto_componentes
SET tipo_calculo = 'PorAlunoXTema'
WHERE nome IN ('Livro Ilustrado', 'Livro de Desafios', 'Livro de Atividades')
  AND tipo_calculo = 'PorAlunoEProfessorXTema';
