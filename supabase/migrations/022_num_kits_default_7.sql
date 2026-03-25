-- Migration 022: num_kits — padrão alterado de 5 para 7 (MPC)

ALTER TABLE propostas ALTER COLUMN num_kits SET DEFAULT 7;

-- Atualiza propostas existentes que ainda têm o valor padrão original (5)
UPDATE propostas SET num_kits = 7 WHERE num_kits = 5;
