-- ═══════════════════════════════════════════════════════════════
-- Migration 021 — Segurança, Constraints e Índices
-- Rodar em DUAS etapas no SQL Editor (enum precisa ser commitado antes)
-- ═══════════════════════════════════════════════════════════════

-- ─── ETAPA 1: Criar enums novos ───────────────────────────────
-- Rodar e aguardar confirmação antes da ETAPA 2

DO $$ BEGIN
  CREATE TYPE tipo_produto AS ENUM (
    'Currículo', 'Plataforma', 'Robótica', 'Socioemocional', 'Avaliação', 'IA', 'Coding'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE objetivo_proposta AS ENUM ('BaterOrcamento', 'MaximizarMargem');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── ETAPA 2: Rodar após confirmar ETAPA 1 ────────────────────

-- CHECK constraints em percentuais
ALTER TABLE propostas
  ADD CONSTRAINT IF NOT EXISTS ck_desconto_global CHECK (desconto_global_percent >= 0 AND desconto_global_percent <= 100),
  ADD CONSTRAINT IF NOT EXISTS ck_tolerancia CHECK (tolerancia_percent >= 0 AND tolerancia_percent <= 100);

ALTER TABLE proposta_componentes
  ADD CONSTRAINT IF NOT EXISTS ck_desconto_comp CHECK (desconto_percent >= 0 AND desconto_percent <= 100);

ALTER TABLE proposta_servicos
  ADD CONSTRAINT IF NOT EXISTS ck_desconto_serv CHECK (desconto_percent >= 0 AND desconto_percent <= 100);

ALTER TABLE proposta_produtos
  ADD CONSTRAINT IF NOT EXISTS ck_desconto_prod CHECK (desconto_percent >= 0 AND desconto_percent <= 100);

ALTER TABLE configuracao_financeira
  ADD CONSTRAINT IF NOT EXISTS ck_margem_min CHECK (margem_minima_percent >= 0 AND margem_minima_percent <= 100),
  ADD CONSTRAINT IF NOT EXISTS ck_margem_max CHECK (margem_global_max_percent >= 0 AND margem_global_max_percent <= 100),
  ADD CONSTRAINT IF NOT EXISTS ck_desconto_max CHECK (desconto_max_percent >= 0 AND desconto_max_percent <= 100);

-- FK com RESTRICT (impede deletar produto com propostas ativas)
ALTER TABLE proposta_produtos
  DROP CONSTRAINT IF EXISTS proposta_produtos_produto_id_fkey;
ALTER TABLE proposta_produtos
  ADD CONSTRAINT proposta_produtos_produto_id_fkey
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT;

-- Índices para FKs sem cobertura
CREATE INDEX IF NOT EXISTS idx_prop_comp_produto_comp_id ON proposta_componentes(produto_componente_id);
CREATE INDEX IF NOT EXISTS idx_prop_serv_produto_serv_id ON proposta_servicos(produto_servico_id);
CREATE INDEX IF NOT EXISTS idx_prop_comp_prop_prod_id ON proposta_componentes(proposta_produto_id);
CREATE INDEX IF NOT EXISTS idx_prop_serv_prop_prod_id ON proposta_servicos(proposta_produto_id);
CREATE INDEX IF NOT EXISTS idx_historico_usuario_id ON proposta_historico(usuario_id);

-- Índices parciais para catálogo ativo
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(id) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_produto_comp_ativo ON produto_componentes(produto_id) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_produto_serv_ativo ON produto_servicos(produto_id) WHERE ativo = TRUE;

-- RLS em produto_series
ALTER TABLE produto_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_leem_produto_series" ON produto_series;
CREATE POLICY "todos_leem_produto_series" ON produto_series
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "adm_gerencia_produto_series" ON produto_series;
CREATE POLICY "adm_gerencia_produto_series" ON produto_series
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'ADM')
  );

-- RLS mais restrita em proposta_historico
DROP POLICY IF EXISTS "inserir_historico" ON proposta_historico;
CREATE POLICY "inserir_historico" ON proposta_historico
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_historico.proposta_id
        AND (
          p.criado_por_usuario_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.perfil IN ('Gestor', 'ADM')
          )
        )
    )
  );
