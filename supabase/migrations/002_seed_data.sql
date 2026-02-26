-- ─────────────────────────────────────────────────────────────────────────────
-- EdTech Propostas — Seed: 13 Produtos + Serviços + Componentes
-- ─────────────────────────────────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase dashboard.
-- Todos os valores de custo_interno_base são reais; valor_venda_base = 0
-- (o comercial define o preço de venda por proposta).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- IDs dos produtos
  p_curiosamente      UUID := gen_random_uuid();
  p_meu_primeiro      UUID := gen_random_uuid();
  p_coding            UUID := gen_random_uuid();
  p_saeb_brasil       UUID := gen_random_uuid();
  p_arduino           UUID := gen_random_uuid();
  p_ia                UUID := gen_random_uuid();
  p_cultura_digital   UUID := gen_random_uuid();
  p_eja               UUID := gen_random_uuid();
  p_enem              UUID := gen_random_uuid();
  p_seppo             UUID := gen_random_uuid();
  p_maxia             UUID := gen_random_uuid();
  p_saeb_evoluir      UUID := gen_random_uuid();
  p_codmos            UUID := gen_random_uuid();

BEGIN

-- ─── Inserção dos 13 Produtos ─────────────────────────────────────────────

INSERT INTO produtos (id, nome, descricao) VALUES
  (p_curiosamente,    'CuriosaMente',                   'Formação presencial de 4h para até 100 participantes. 1 pedagogo formador.'),
  (p_meu_primeiro,    'Meu Primeiro Código',            'Formação presencial de 8h para até 50 participantes. 2 formadores (pedagogo + tech). Inclui kit de hardware.'),
  (p_coding,          'Coding',                         'Formação presencial de 4h para até 30 participantes. 2 formadores (tech + assistente).'),
  (p_saeb_brasil,     'SAEB Brasil',                    'Formação presencial de 8h para 30–50 participantes. 2 a 3 especialistas.'),
  (p_arduino,         'Edtech Arduino',                 'Formação presencial de 8h para até 50 participantes. 2 formadores (tech + assistente). Inclui kit Arduino.'),
  (p_ia,              'Edtech IA',                      'Formação presencial de 8h para até 30 participantes. 2 especialistas em IA. Inclui kit/software de IA.'),
  (p_cultura_digital, 'Cultura Digital e Programação',  'Formação presencial de 4h para até 60 participantes. 1 formador tech.'),
  (p_eja,             'EJA',                            'Formação presencial de 4h para até 100 participantes. 1 pedagogo formador.'),
  (p_enem,            'ENEM',                           'Formação presencial de 8h para até 100 participantes. 4 pedagogos + 1 palestrante convidado.'),
  (p_seppo,           'SEPPO',                          'Formação presencial de 6h em 2 encontros para até 50 participantes. 1 formador tech. Inclui licença de plataforma.'),
  (p_maxia,           'MAXIA',                          'Formação presencial de 4h em 2 encontros para até 30 participantes. 1 formador tech. Inclui licença de plataforma.'),
  (p_saeb_evoluir,    'SAEB Evoluir',                   'Formação intensiva de 20h para até 50 participantes. 5 pedagogos. Inclui plataforma Kóleos.'),
  (p_codmos,          'CODMOS',                         'Formação presencial de 4h para até 50 participantes. 1 formador tech. Inclui licença de plataforma.');

-- ─── Macro: serviços comuns ───────────────────────────────────────────────
-- Para cada produto inserimos os serviços padrão.
-- Usamos INSERT INTO...VALUES com múltiplas linhas por produto.

-- ── CuriosaMente ──────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_curiosamente, 'Formação Presencial (4h)',   'Fixo',         TRUE,  0, 0),
  (p_curiosamente, 'Formação EAD',               'Fixo',         FALSE, 0, 0),
  (p_curiosamente, 'Assessoria Pedagógica',      'Fixo',         FALSE, 0, 0),
  (p_curiosamente, 'Honorário do Formador',      'Fixo',         TRUE,  0, 130),
  (p_curiosamente, 'Hospedagem',                 'Fixo',         FALSE, 0, 300),
  (p_curiosamente, 'Alimentação',                'Fixo',         FALSE, 0, 100),
  (p_curiosamente, 'Kit Lanche',                 'PorProfessor', FALSE, 0, 15),
  (p_curiosamente, 'Caneta',                     'PorProfessor', FALSE, 0, 5),
  (p_curiosamente, 'Bloco de Anotação',          'PorProfessor', FALSE, 0, 5),
  (p_curiosamente, 'Deslocamento',               'Fixo',         FALSE, 0, 0);

-- ── Meu Primeiro Código ───────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_meu_primeiro, 'Formação Presencial (8h)',   'Fixo',         TRUE,  0, 0),
  (p_meu_primeiro, 'Formação EAD',               'Fixo',         FALSE, 0, 0),
  (p_meu_primeiro, 'Assessoria Pedagógica',      'Fixo',         FALSE, 0, 0),
  (p_meu_primeiro, 'Honorário do Formador',      'Fixo',         TRUE,  0, 130),
  (p_meu_primeiro, 'Hospedagem',                 'Fixo',         FALSE, 0, 300),
  (p_meu_primeiro, 'Alimentação',                'Fixo',         FALSE, 0, 100),
  (p_meu_primeiro, 'Kit Lanche',                 'PorProfessor', FALSE, 0, 15),
  (p_meu_primeiro, 'Caneta',                     'PorProfessor', FALSE, 0, 5),
  (p_meu_primeiro, 'Bloco de Anotação',          'PorProfessor', FALSE, 0, 5),
  (p_meu_primeiro, 'Deslocamento',               'Fixo',         FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_meu_primeiro, 'Kit de Hardware',            'Kit',         'Fixo', FALSE, 0, 0);

-- ── Coding ────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_coding, 'Formação Presencial (4h)',          'Fixo',         TRUE,  0, 0),
  (p_coding, 'Formação EAD',                      'Fixo',         FALSE, 0, 0),
  (p_coding, 'Assessoria Pedagógica',             'Fixo',         FALSE, 0, 0),
  (p_coding, 'Honorário do Formador',             'Fixo',         TRUE,  0, 130),
  (p_coding, 'Hospedagem',                        'Fixo',         FALSE, 0, 300),
  (p_coding, 'Alimentação',                       'Fixo',         FALSE, 0, 100),
  (p_coding, 'Kit Lanche',                        'PorProfessor', FALSE, 0, 15),
  (p_coding, 'Caneta',                            'PorProfessor', FALSE, 0, 5),
  (p_coding, 'Bloco de Anotação',                 'PorProfessor', FALSE, 0, 5),
  (p_coding, 'Deslocamento',                      'Fixo',         FALSE, 0, 0);

-- ── SAEB Brasil ───────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_saeb_brasil, 'Formação Presencial (8h)',     'Fixo',         TRUE,  0, 0),
  (p_saeb_brasil, 'Formação EAD',                 'Fixo',         FALSE, 0, 0),
  (p_saeb_brasil, 'Assessoria Pedagógica',        'Fixo',         FALSE, 0, 0),
  (p_saeb_brasil, 'Honorário do Formador',        'Fixo',         TRUE,  0, 130),
  (p_saeb_brasil, 'Hospedagem',                   'Fixo',         FALSE, 0, 300),
  (p_saeb_brasil, 'Alimentação',                  'Fixo',         FALSE, 0, 100),
  (p_saeb_brasil, 'Kit Lanche',                   'PorProfessor', FALSE, 0, 15),
  (p_saeb_brasil, 'Caneta',                       'PorProfessor', FALSE, 0, 5),
  (p_saeb_brasil, 'Bloco de Anotação',            'PorProfessor', FALSE, 0, 5),
  (p_saeb_brasil, 'Deslocamento',                 'Fixo',         FALSE, 0, 0);

-- ── Edtech Arduino ────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_arduino, 'Formação Presencial (8h)',         'Fixo',         TRUE,  0, 0),
  (p_arduino, 'Formação EAD',                     'Fixo',         FALSE, 0, 0),
  (p_arduino, 'Assessoria Pedagógica',            'Fixo',         FALSE, 0, 0),
  (p_arduino, 'Honorário do Formador',            'Fixo',         TRUE,  0, 130),
  (p_arduino, 'Hospedagem',                       'Fixo',         FALSE, 0, 300),
  (p_arduino, 'Alimentação',                      'Fixo',         FALSE, 0, 100),
  (p_arduino, 'Kit Lanche',                       'PorProfessor', FALSE, 0, 15),
  (p_arduino, 'Caneta',                           'PorProfessor', FALSE, 0, 5),
  (p_arduino, 'Bloco de Anotação',                'PorProfessor', FALSE, 0, 5),
  (p_arduino, 'Deslocamento',                     'Fixo',         FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_arduino, 'Kit Arduino',                      'Kit',         'Fixo', FALSE, 0, 0);

-- ── Edtech IA ─────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_ia, 'Formação Presencial (8h)',              'Fixo',         TRUE,  0, 0),
  (p_ia, 'Formação EAD',                          'Fixo',         FALSE, 0, 0),
  (p_ia, 'Assessoria Pedagógica',                 'Fixo',         FALSE, 0, 0),
  (p_ia, 'Honorário do Formador',                 'Fixo',         TRUE,  0, 130),
  (p_ia, 'Hospedagem',                            'Fixo',         FALSE, 0, 300),
  (p_ia, 'Alimentação',                           'Fixo',         FALSE, 0, 100),
  (p_ia, 'Kit Lanche',                            'PorProfessor', FALSE, 0, 15),
  (p_ia, 'Caneta',                                'PorProfessor', FALSE, 0, 5),
  (p_ia, 'Bloco de Anotação',                     'PorProfessor', FALSE, 0, 5),
  (p_ia, 'Deslocamento',                          'Fixo',         FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_ia, 'Kit de Software/Hardware IA',           'Kit',         'Fixo', FALSE, 0, 0);

-- ── Cultura Digital e Programação ────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_cultura_digital, 'Formação Presencial (4h)', 'Fixo',         TRUE,  0, 0),
  (p_cultura_digital, 'Formação EAD',             'Fixo',         FALSE, 0, 0),
  (p_cultura_digital, 'Assessoria Pedagógica',    'Fixo',         FALSE, 0, 0),
  (p_cultura_digital, 'Honorário do Formador',    'Fixo',         TRUE,  0, 130),
  (p_cultura_digital, 'Hospedagem',               'Fixo',         FALSE, 0, 300),
  (p_cultura_digital, 'Alimentação',              'Fixo',         FALSE, 0, 100),
  (p_cultura_digital, 'Kit Lanche',               'PorProfessor', FALSE, 0, 15),
  (p_cultura_digital, 'Caneta',                   'PorProfessor', FALSE, 0, 5),
  (p_cultura_digital, 'Bloco de Anotação',        'PorProfessor', FALSE, 0, 5),
  (p_cultura_digital, 'Deslocamento',             'Fixo',         FALSE, 0, 0);

-- ── EJA ───────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_eja, 'Formação Presencial (4h)',             'Fixo',         TRUE,  0, 0),
  (p_eja, 'Formação EAD',                         'Fixo',         FALSE, 0, 0),
  (p_eja, 'Assessoria Pedagógica',                'Fixo',         FALSE, 0, 0),
  (p_eja, 'Honorário do Formador',                'Fixo',         TRUE,  0, 130),
  (p_eja, 'Hospedagem',                           'Fixo',         FALSE, 0, 300),
  (p_eja, 'Alimentação',                          'Fixo',         FALSE, 0, 100),
  (p_eja, 'Kit Lanche',                           'PorProfessor', FALSE, 0, 15),
  (p_eja, 'Caneta',                               'PorProfessor', FALSE, 0, 5),
  (p_eja, 'Bloco de Anotação',                    'PorProfessor', FALSE, 0, 5),
  (p_eja, 'Deslocamento',                         'Fixo',         FALSE, 0, 0);

-- ── ENEM ──────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_enem, 'Formação Presencial (8h)',            'Fixo',         TRUE,  0, 0),
  (p_enem, 'Formação EAD',                        'Fixo',         FALSE, 0, 0),
  (p_enem, 'Assessoria Pedagógica',               'Fixo',         FALSE, 0, 0),
  (p_enem, 'Honorário do Formador',               'Fixo',         TRUE,  0, 130),
  (p_enem, 'Palestrante Convidado',               'Fixo',         FALSE, 0, 10000),
  (p_enem, 'Hospedagem',                          'Fixo',         FALSE, 0, 300),
  (p_enem, 'Alimentação',                         'Fixo',         FALSE, 0, 100),
  (p_enem, 'Kit Lanche',                          'PorProfessor', FALSE, 0, 15),
  (p_enem, 'Caneta',                              'PorProfessor', FALSE, 0, 5),
  (p_enem, 'Bloco de Anotação',                   'PorProfessor', FALSE, 0, 5),
  (p_enem, 'Deslocamento',                        'Fixo',         FALSE, 0, 0);

-- ── SEPPO ─────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_seppo, 'Formação Presencial (6h/2 encontros)', 'Fixo',       TRUE,  0, 0),
  (p_seppo, 'Formação EAD',                         'Fixo',       FALSE, 0, 0),
  (p_seppo, 'Assessoria Pedagógica',                'Fixo',       FALSE, 0, 0),
  (p_seppo, 'Honorário do Formador',                'Fixo',       TRUE,  0, 130),
  (p_seppo, 'Hospedagem',                           'Fixo',       FALSE, 0, 300),
  (p_seppo, 'Alimentação',                          'Fixo',       FALSE, 0, 100),
  (p_seppo, 'Kit Lanche',                           'PorProfessor', FALSE, 0, 15),
  (p_seppo, 'Caneta',                               'PorProfessor', FALSE, 0, 5),
  (p_seppo, 'Bloco de Anotação',                    'PorProfessor', FALSE, 0, 5),
  (p_seppo, 'Deslocamento',                         'Fixo',       FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_seppo, 'Licença Plataforma SEPPO',           'Plataforma',  'Fixo', FALSE, 0, 0);

-- ── MAXIA ─────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_maxia, 'Formação Presencial (4h/2 encontros)', 'Fixo',       TRUE,  0, 0),
  (p_maxia, 'Formação EAD',                         'Fixo',       FALSE, 0, 0),
  (p_maxia, 'Assessoria Pedagógica',                'Fixo',       FALSE, 0, 0),
  (p_maxia, 'Honorário do Formador',                'Fixo',       TRUE,  0, 130),
  (p_maxia, 'Hospedagem',                           'Fixo',       FALSE, 0, 300),
  (p_maxia, 'Alimentação',                          'Fixo',       FALSE, 0, 100),
  (p_maxia, 'Kit Lanche',                           'PorProfessor', FALSE, 0, 15),
  (p_maxia, 'Caneta',                               'PorProfessor', FALSE, 0, 5),
  (p_maxia, 'Bloco de Anotação',                    'PorProfessor', FALSE, 0, 5),
  (p_maxia, 'Deslocamento',                         'Fixo',       FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_maxia, 'Licença Plataforma MAXIA',           'Plataforma',  'Fixo', FALSE, 0, 0);

-- ── SAEB Evoluir ──────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_saeb_evoluir, 'Formação Presencial (20h)',    'Fixo',         TRUE,  0, 0),
  (p_saeb_evoluir, 'Formação EAD',                 'Fixo',         FALSE, 0, 0),
  (p_saeb_evoluir, 'Assessoria Pedagógica',        'Fixo',         FALSE, 0, 0),
  (p_saeb_evoluir, 'Honorário do Formador',        'Fixo',         TRUE,  0, 130),
  (p_saeb_evoluir, 'Hospedagem',                   'Fixo',         FALSE, 0, 300),
  (p_saeb_evoluir, 'Alimentação',                  'Fixo',         FALSE, 0, 100),
  (p_saeb_evoluir, 'Kit Lanche',                   'PorProfessor', FALSE, 0, 15),
  (p_saeb_evoluir, 'Caneta',                       'PorProfessor', FALSE, 0, 5),
  (p_saeb_evoluir, 'Bloco de Anotação',            'PorProfessor', FALSE, 0, 5),
  (p_saeb_evoluir, 'Deslocamento',                 'Fixo',         FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_saeb_evoluir, 'Plataforma Kóleos',            'Plataforma',  'Fixo', FALSE, 0, 0);

-- ── CODMOS ────────────────────────────────────────────────────────────────
INSERT INTO produto_servicos (produto_id, nome, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_codmos, 'Formação Presencial (4h)',           'Fixo',         TRUE,  0, 0),
  (p_codmos, 'Formação EAD',                       'Fixo',         FALSE, 0, 0),
  (p_codmos, 'Assessoria Pedagógica',              'Fixo',         FALSE, 0, 0),
  (p_codmos, 'Honorário do Formador',              'Fixo',         TRUE,  0, 130),
  (p_codmos, 'Hospedagem',                         'Fixo',         FALSE, 0, 300),
  (p_codmos, 'Alimentação',                        'Fixo',         FALSE, 0, 100),
  (p_codmos, 'Kit Lanche',                         'PorProfessor', FALSE, 0, 15),
  (p_codmos, 'Caneta',                             'PorProfessor', FALSE, 0, 5),
  (p_codmos, 'Bloco de Anotação',                  'PorProfessor', FALSE, 0, 5),
  (p_codmos, 'Deslocamento',                       'Fixo',         FALSE, 0, 0);

INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, obrigatorio, valor_venda_base, custo_interno_base) VALUES
  (p_codmos, 'Licença Plataforma CODMOS',          'Plataforma',  'Fixo', FALSE, 0, 0);

END;
$$;
