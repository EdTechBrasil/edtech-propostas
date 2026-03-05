-- Adiciona coluna de ordem para drag-and-drop na tela de Produtos
ALTER TABLE proposta_produtos ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
