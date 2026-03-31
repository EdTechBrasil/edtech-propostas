-- Remove duplicatas em proposta_componentes mantendo a linha com maior quantidade
-- (resultado das duplicatas criadas por produto_componentes com componentes repetidos)
DELETE FROM proposta_componentes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY proposta_produto_id, produto_componente_id
        ORDER BY quantidade DESC, criado_em ASC
      ) AS rn
    FROM proposta_componentes
  ) ranked
  WHERE rn > 1
);
