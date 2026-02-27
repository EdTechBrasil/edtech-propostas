-- Adiciona coluna de ordem customizada para drag-and-drop
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE produtos   ADD COLUMN IF NOT EXISTS ordem INTEGER;

-- Inicializar ordem existente por data (propostas)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY criado_em DESC) AS rn
  FROM propostas
)
UPDATE propostas SET ordem = ranked.rn FROM ranked WHERE propostas.id = ranked.id;

-- Inicializar ordem existente por nome (produtos)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nome) AS rn
  FROM produtos
)
UPDATE produtos SET ordem = ranked.rn FROM ranked WHERE produtos.id = ranked.id;
