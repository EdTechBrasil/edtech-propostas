-- Migration: 4 novos produtos — Robótica Educacional/Cria+Bot, Ciclo Aprendiz, Trilhas do Saber, Cocri+Ação
-- ⚠️  Rodar manualmente no Supabase SQL Editor

DO $$
DECLARE
  id_robotica   uuid := gen_random_uuid();
  id_ciclo      uuid := gen_random_uuid();
  id_trilhas    uuid := gen_random_uuid();
  id_cocri      uuid := gen_random_uuid();
BEGIN

  -- ─────────────────────────────────────────────
  -- 1. ROBÓTICA EDUCACIONAL / CRIA+BOT
  -- ─────────────────────────────────────────────
  INSERT INTO produtos (id, nome, descricao, ativo, tipo)
  VALUES (id_robotica, 'Robótica Educacional / Cria+Bot',
          'Kit de robótica educacional para EF Anos Iniciais/Finais e Ensino Médio.',
          true, 'Robótica');

  -- Serviços
  INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, custo_interno_base, ativo, ordem) VALUES
    (id_robotica, 'Formação Presencial (4h)',  'Fixo',          true,  0,   true, 1),
    (id_robotica, 'Formação EAD',              'Fixo',          false, 0,   true, 2),
    (id_robotica, 'Assessoria Pedagógica',     'Fixo',          false, 0,   true, 3),
    (id_robotica, 'Honorário do Formador',     'Fixo',          true,  130, true, 4),
    (id_robotica, 'Hospedagem',                'Fixo',          false, 300, true, 5),
    (id_robotica, 'Alimentação',               'Fixo',          false, 100, true, 6),
    (id_robotica, 'Kit Lanche',                'PorProfessor',  false, 15,  true, 7),
    (id_robotica, 'Caneta',                    'PorProfessor',  false, 5,   true, 8),
    (id_robotica, 'Bloco de Anotação',         'PorProfessor',  false, 5,   true, 9),
    (id_robotica, 'Deslocamento',              'Fixo',          false, 0,   true, 10);

  -- Componentes
  INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo, ordem) VALUES
    (id_robotica, 'Livros do Aluno (EF)',   'Livro', 'PorAluno',     0, 0, true,  true, 1),
    (id_robotica, 'Livros do Professor (EF)','Livro','PorProfessor', 0, 0, true,  true, 2),
    (id_robotica, 'Coleção Cria+Bot (EM)',  'Livro', 'PorProfessor', 0, 0, false, true, 3);

  -- ─────────────────────────────────────────────
  -- 2. CICLO APRENDIZ
  -- ─────────────────────────────────────────────
  INSERT INTO produtos (id, nome, descricao, ativo, tipo)
  VALUES (id_ciclo, 'Ciclo Aprendiz',
          'Temas Contemporâneos Transversais para Anos Iniciais e Finais.',
          true, 'Currículo');

  INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, custo_interno_base, ativo, ordem) VALUES
    (id_ciclo, 'Formação Presencial (4h)',  'Fixo',          true,  0,   true, 1),
    (id_ciclo, 'Formação EAD',              'Fixo',          false, 0,   true, 2),
    (id_ciclo, 'Assessoria Pedagógica',     'Fixo',          false, 0,   true, 3),
    (id_ciclo, 'Honorário do Formador',     'Fixo',          true,  130, true, 4),
    (id_ciclo, 'Hospedagem',                'Fixo',          false, 300, true, 5),
    (id_ciclo, 'Alimentação',               'Fixo',          false, 100, true, 6),
    (id_ciclo, 'Kit Lanche',                'PorProfessor',  false, 15,  true, 7),
    (id_ciclo, 'Caneta',                    'PorProfessor',  false, 5,   true, 8),
    (id_ciclo, 'Bloco de Anotação',         'PorProfessor',  false, 5,   true, 9),
    (id_ciclo, 'Deslocamento',              'Fixo',          false, 0,   true, 10);

  INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo, ordem) VALUES
    (id_ciclo, 'Livro do Aluno',    'Livro', 'PorAluno',     0, 0, true, true, 1),
    (id_ciclo, 'Guia do Professor', 'Livro', 'PorProfessor', 0, 0, true, true, 2);

  -- ─────────────────────────────────────────────
  -- 3. TRILHAS DO SABER
  -- ─────────────────────────────────────────────
  INSERT INTO produtos (id, nome, descricao, ativo, tipo)
  VALUES (id_trilhas, 'Trilhas do Saber',
          'Temas Contemporâneos Transversais para Anos Finais (6º–9º).',
          true, 'Currículo');

  INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, custo_interno_base, ativo, ordem) VALUES
    (id_trilhas, 'Formação Presencial (4h)',  'Fixo',          true,  0,   true, 1),
    (id_trilhas, 'Formação EAD',              'Fixo',          false, 0,   true, 2),
    (id_trilhas, 'Assessoria Pedagógica',     'Fixo',          false, 0,   true, 3),
    (id_trilhas, 'Honorário do Formador',     'Fixo',          true,  130, true, 4),
    (id_trilhas, 'Hospedagem',                'Fixo',          false, 300, true, 5),
    (id_trilhas, 'Alimentação',               'Fixo',          false, 100, true, 6),
    (id_trilhas, 'Kit Lanche',                'PorProfessor',  false, 15,  true, 7),
    (id_trilhas, 'Caneta',                    'PorProfessor',  false, 5,   true, 8),
    (id_trilhas, 'Bloco de Anotação',         'PorProfessor',  false, 5,   true, 9),
    (id_trilhas, 'Deslocamento',              'Fixo',          false, 0,   true, 10);

  INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo, ordem) VALUES
    (id_trilhas, 'Livro do Aluno',                   'Livro', 'PorAluno',     0, 0, true, true, 1),
    (id_trilhas, 'Orientação Didática do Professor', 'Livro', 'PorProfessor', 0, 0, true, true, 2);

  -- ─────────────────────────────────────────────
  -- 4. COCRI+AÇÃO
  -- ─────────────────────────────────────────────
  INSERT INTO produtos (id, nome, descricao, ativo, tipo)
  VALUES (id_cocri, 'Cocri+Ação',
          'Competências Socioemocionais para 6º–9º ano.',
          true, 'Socioemocional');

  INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, custo_interno_base, ativo, ordem) VALUES
    (id_cocri, 'Formação Presencial (4h)',  'Fixo',          true,  0,   true, 1),
    (id_cocri, 'Formação EAD',              'Fixo',          false, 0,   true, 2),
    (id_cocri, 'Assessoria Pedagógica',     'Fixo',          false, 0,   true, 3),
    (id_cocri, 'Honorário do Formador',     'Fixo',          true,  130, true, 4),
    (id_cocri, 'Hospedagem',                'Fixo',          false, 300, true, 5),
    (id_cocri, 'Alimentação',               'Fixo',          false, 100, true, 6),
    (id_cocri, 'Kit Lanche',                'PorProfessor',  false, 15,  true, 7),
    (id_cocri, 'Caneta',                    'PorProfessor',  false, 5,   true, 8),
    (id_cocri, 'Bloco de Anotação',         'PorProfessor',  false, 5,   true, 9),
    (id_cocri, 'Deslocamento',              'Fixo',          false, 0,   true, 10);

  INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo, ordem) VALUES
    (id_cocri, 'Livro do Aluno',    'Livro', 'PorAluno',     0, 0, true, true, 1),
    (id_cocri, 'Livro do Professor','Livro', 'PorProfessor', 0, 0, true, true, 2);

END $$;
