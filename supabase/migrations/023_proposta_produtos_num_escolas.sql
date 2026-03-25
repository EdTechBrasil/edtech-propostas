-- Migration 023: escolas por produto
-- Adiciona num_escolas em proposta_produtos para rastrear escolas separadas por produto

ALTER TABLE proposta_produtos ADD COLUMN IF NOT EXISTS num_escolas INTEGER NOT NULL DEFAULT 0;

-- Inicializa com o total da proposta para manter comportamento atual
UPDATE proposta_produtos pp
SET num_escolas = pr.num_escolas
FROM propostas pr
WHERE pp.proposta_id = pr.id;
