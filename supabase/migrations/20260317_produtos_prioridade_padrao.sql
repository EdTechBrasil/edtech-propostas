-- Adiciona prioridade padrão por produto (usada no wizard de Proposta por Orçamento)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS prioridade_padrao integer NOT NULL DEFAULT 3;
