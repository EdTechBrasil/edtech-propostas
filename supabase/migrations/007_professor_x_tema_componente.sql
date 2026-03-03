-- Adiciona componente PorProfessorXTema ao produto "Meu Primeiro Código"
-- Execute este script no Supabase SQL Editor

DO $$
DECLARE
  prod_id uuid;
BEGIN
  SELECT id INTO prod_id
  FROM produtos
  WHERE nome ILIKE '%Meu Primeiro Código%'
  LIMIT 1;

  IF prod_id IS NULL THEN
    RAISE EXCEPTION 'Produto "Meu Primeiro Código" não encontrado';
  END IF;

  -- Guia do Professor
  INSERT INTO produto_componentes (produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio)
  VALUES (prod_id, 'Guia do Professor', 'Livro', 'PorProfessorXTema', 0, 0, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Componente PorProfessorXTema adicionado ao produto: %', prod_id;
END $$;
