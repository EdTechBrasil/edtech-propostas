-- Novo tipo de cálculo
ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorEscolaXKit';

-- Novo campo na proposta (default 5)
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_kits INTEGER NOT NULL DEFAULT 5;

-- Atualiza componente Kit de Hardware para usar o novo tipo
UPDATE produto_componentes
SET tipo_calculo = 'PorEscolaXKit'
WHERE nome = 'Kit de Hardware'
  AND tipo_calculo = 'Fixo';
