-- ─────────────────────────────────────────────────────────────────────────────
-- EdTech Propostas — Schema inicial (v1)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE perfil_usuario AS ENUM ('Comercial', 'Gestor', 'ADM');

CREATE TYPE status_proposta AS ENUM (
  'Rascunho',
  'Em_revisao',
  'Aguardando_aprovacao',
  'Aprovada_excecao',
  'Pronta_pdf',
  'Cancelada'
);

CREATE TYPE tipo_repasse AS ENUM ('Nenhum', 'Fixo', 'Percentual');

CREATE TYPE categoria_componente AS ENUM (
  'LicencaAluno',
  'LicencaProfessor',
  'Kit',
  'Livro',
  'Tema',
  'Pagina',
  'Credito',
  'ItemFixo',
  'Plataforma'
);

CREATE TYPE tipo_calculo AS ENUM (
  'Fixo',
  'PorAluno',
  'PorProfessor',
  'PorEscola',
  'PorSerie'
);

CREATE TYPE tipo_evento_proposta AS ENUM (
  'Criacao',
  'MudancaOrcamento',
  'AddProduto',
  'RemoverProduto',
  'AlterarComponente',
  'AlterarServico',
  'AlterarDesconto',
  'AlterarRepasse',
  'AtualizarCliente',
  'SolicitarAprovacao',
  'AprovarExcecao',
  'GerarPDF'
);

-- ─── Tabelas ──────────────────────────────────────────────────────────────────

-- Usuarios (espelho do auth.users)
CREATE TABLE usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  perfil      perfil_usuario NOT NULL DEFAULT 'Comercial',
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuracao financeira global (1 registro ativo por vez)
CREATE TABLE configuracao_financeira (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo                     BOOLEAN NOT NULL DEFAULT TRUE,
  margem_minima_percent     NUMERIC(5,2) NOT NULL DEFAULT 12,
  margem_global_max_percent NUMERIC(5,2) NOT NULL DEFAULT 30,
  desconto_max_percent      NUMERIC(5,2) NOT NULL DEFAULT 20,
  criado_por_usuario_id     UUID NOT NULL REFERENCES usuarios(id),
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apenas 1 configuração ativa por vez
CREATE UNIQUE INDEX idx_config_financeira_ativa
  ON configuracao_financeira (ativo)
  WHERE ativo = TRUE;

-- Produtos (catálogo)
CREATE TABLE produtos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  descricao     TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Componentes do produto (catálogo)
CREATE TABLE produto_componentes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id          UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  categoria           categoria_componente NOT NULL,
  tipo_calculo        tipo_calculo NOT NULL DEFAULT 'Fixo',
  obrigatorio         BOOLEAN NOT NULL DEFAULT FALSE,
  valor_venda_base    NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_interno_base  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serviços do produto (catálogo)
CREATE TABLE produto_servicos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id          UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  tipo_calculo        tipo_calculo NOT NULL DEFAULT 'Fixo',
  obrigatorio         BOOLEAN NOT NULL DEFAULT FALSE,
  valor_venda_base    NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_interno_base  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Propostas
CREATE TABLE propostas (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_por_usuario_id     UUID NOT NULL REFERENCES usuarios(id),
  status                    status_proposta NOT NULL DEFAULT 'Rascunho',
  orcamento_alvo            NUMERIC(14,2) NOT NULL,
  limite_orcamento_max      NUMERIC(14,2),
  desconto_global_percent   NUMERIC(5,2) NOT NULL DEFAULT 0,
  repasse_tipo              tipo_repasse NOT NULL DEFAULT 'Nenhum',
  repasse_valor             NUMERIC(12,2) NOT NULL DEFAULT 0,
  publico_descricao         TEXT,
  cliente_nome_instituicao  TEXT,
  cliente_cnpj              TEXT,
  cliente_responsavel       TEXT,
  cliente_email             TEXT,
  cliente_cidade            TEXT,
  validade_proposta         DATE,
  pdf_path                  TEXT,
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Produtos da proposta
CREATE TABLE proposta_produtos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id      UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  produto_id       UUID NOT NULL REFERENCES produtos(id),
  desconto_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Componentes da proposta (snapshot do catálogo)
CREATE TABLE proposta_componentes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id           UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  proposta_produto_id   UUID NOT NULL REFERENCES proposta_produtos(id) ON DELETE CASCADE,
  produto_componente_id UUID NOT NULL REFERENCES produto_componentes(id),
  quantidade            NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_venda_unit      NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_interno_unit    NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_percent      NUMERIC(5,2) NOT NULL DEFAULT 0,
  obrigatorio           BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serviços da proposta (snapshot do catálogo)
CREATE TABLE proposta_servicos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id         UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  proposta_produto_id UUID NOT NULL REFERENCES proposta_produtos(id) ON DELETE CASCADE,
  produto_servico_id  UUID NOT NULL REFERENCES produto_servicos(id),
  quantidade          NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_venda_unit    NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_interno_unit  NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
  obrigatorio         BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aprovações de exceção de margem
CREATE TABLE aprovacao_excecao_margem (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id                 UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  solicitado_por_usuario_id   UUID NOT NULL REFERENCES usuarios(id),
  aprovado_por_usuario_id     UUID REFERENCES usuarios(id),
  margem_minima_percent       NUMERIC(5,2) NOT NULL,
  margem_calculada_percent    NUMERIC(5,2) NOT NULL,
  motivo                      TEXT,
  aprovado                    BOOLEAN,
  criado_em                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico da proposta
CREATE TABLE proposta_historico (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id  UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  usuario_id   UUID NOT NULL REFERENCES usuarios(id),
  tipo_evento  tipo_evento_proposta NOT NULL,
  detalhes     TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_propostas_criado_por ON propostas(criado_por_usuario_id);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_proposta_produtos_proposta ON proposta_produtos(proposta_id);
CREATE INDEX idx_proposta_componentes_proposta ON proposta_componentes(proposta_id);
CREATE INDEX idx_proposta_servicos_proposta ON proposta_servicos(proposta_id);
CREATE INDEX idx_proposta_historico_proposta ON proposta_historico(proposta_id);
CREATE INDEX idx_aprovacao_proposta ON aprovacao_excecao_margem(proposta_id);

-- ─── Trigger: atualizado_em automático ───────────────────────────────────────

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_produtos_atualizado_em
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_produto_componentes_atualizado_em
  BEFORE UPDATE ON produto_componentes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_produto_servicos_atualizado_em
  BEFORE UPDATE ON produto_servicos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_propostas_atualizado_em
  BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ─── Trigger: criar usuário automaticamente após signup ──────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'perfil')::perfil_usuario, 'Comercial')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── View: Cálculo financeiro da proposta ─────────────────────────────────────
-- Regra de desconto: o mais específico prevalece
--   componente > produto > global

CREATE OR REPLACE VIEW proposta_financeiro AS
WITH desconto_efetivo_comp AS (
  -- Para cada componente, determina o desconto que prevalece
  SELECT
    pc.id,
    pc.proposta_id,
    pc.proposta_produto_id,
    pc.quantidade,
    pc.valor_venda_unit,
    pc.custo_interno_unit,
    CASE
      WHEN pc.desconto_percent > 0 THEN pc.desconto_percent
      WHEN pp.desconto_percent > 0 THEN pp.desconto_percent
      ELSE p.desconto_global_percent
    END AS desconto_final
  FROM proposta_componentes pc
  JOIN proposta_produtos pp ON pp.id = pc.proposta_produto_id
  JOIN propostas p ON p.id = pc.proposta_id
),
desconto_efetivo_serv AS (
  SELECT
    ps.id,
    ps.proposta_id,
    ps.proposta_produto_id,
    ps.quantidade,
    ps.valor_venda_unit,
    ps.custo_interno_unit,
    CASE
      WHEN ps.desconto_percent > 0 THEN ps.desconto_percent
      WHEN pp.desconto_percent > 0 THEN pp.desconto_percent
      ELSE p.desconto_global_percent
    END AS desconto_final
  FROM proposta_servicos ps
  JOIN proposta_produtos pp ON pp.id = ps.proposta_produto_id
  JOIN propostas p ON p.id = ps.proposta_id
),
receitas AS (
  SELECT
    proposta_id,
    SUM(quantidade * valor_venda_unit) AS receita_bruta_comp,
    SUM(quantidade * valor_venda_unit * (1 - desconto_final / 100)) AS receita_liq_comp,
    SUM(quantidade * custo_interno_unit) AS custo_comp
  FROM desconto_efetivo_comp
  GROUP BY proposta_id
),
receitas_serv AS (
  SELECT
    proposta_id,
    SUM(quantidade * valor_venda_unit) AS receita_bruta_serv,
    SUM(quantidade * valor_venda_unit * (1 - desconto_final / 100)) AS receita_liq_serv,
    SUM(quantidade * custo_interno_unit) AS custo_serv
  FROM desconto_efetivo_serv
  GROUP BY proposta_id
)
SELECT
  p.id AS proposta_id,
  COALESCE(r.receita_bruta_comp, 0) + COALESCE(s.receita_bruta_serv, 0) AS receita_bruta,
  (COALESCE(r.receita_bruta_comp, 0) + COALESCE(s.receita_bruta_serv, 0))
    - (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) AS total_descontos,
  COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0) AS receita_liquida,
  COALESCE(r.custo_comp, 0) AS custo_produtos,
  COALESCE(s.custo_serv, 0) AS custo_servicos,
  CASE
    WHEN p.repasse_tipo = 'Fixo' THEN p.repasse_valor
    WHEN p.repasse_tipo = 'Percentual' THEN
      (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) * p.repasse_valor / 100
    ELSE 0
  END AS repasse_valor_calculado,
  -- custo total = custo_comp + custo_serv + repasse
  COALESCE(r.custo_comp, 0) + COALESCE(s.custo_serv, 0) +
  CASE
    WHEN p.repasse_tipo = 'Fixo' THEN p.repasse_valor
    WHEN p.repasse_tipo = 'Percentual' THEN
      (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) * p.repasse_valor / 100
    ELSE 0
  END AS custo_total,
  -- lucro bruto
  (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) -
  (
    COALESCE(r.custo_comp, 0) + COALESCE(s.custo_serv, 0) +
    CASE
      WHEN p.repasse_tipo = 'Fixo' THEN p.repasse_valor
      WHEN p.repasse_tipo = 'Percentual' THEN
        (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) * p.repasse_valor / 100
      ELSE 0
    END
  ) AS lucro_bruto,
  -- margem %
  CASE
    WHEN (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) = 0 THEN 0
    ELSE ROUND(
      (
        (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) -
        (
          COALESCE(r.custo_comp, 0) + COALESCE(s.custo_serv, 0) +
          CASE
            WHEN p.repasse_tipo = 'Fixo' THEN p.repasse_valor
            WHEN p.repasse_tipo = 'Percentual' THEN
              (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) * p.repasse_valor / 100
            ELSE 0
          END
        )
      ) / (COALESCE(r.receita_liq_comp, 0) + COALESCE(s.receita_liq_serv, 0)) * 100,
      2
    )
  END AS margem_percent
FROM propostas p
LEFT JOIN receitas r ON r.proposta_id = p.id
LEFT JOIN receitas_serv s ON s.proposta_id = p.id;

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovacao_excecao_margem ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_historico ENABLE ROW LEVEL SECURITY;

-- Helper: retorna perfil do usuário autenticado
CREATE OR REPLACE FUNCTION get_perfil_atual()
RETURNS perfil_usuario AS $$
  SELECT perfil FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Usuarios ──

-- Cada usuário vê seu próprio perfil
CREATE POLICY "usuario_ver_proprio" ON usuarios
  FOR SELECT USING (id = auth.uid());

-- ADM vê todos
CREATE POLICY "adm_ver_todos_usuarios" ON usuarios
  FOR SELECT USING (get_perfil_atual() = 'ADM');

-- ADM pode criar e editar usuários
CREATE POLICY "adm_insert_usuario" ON usuarios
  FOR INSERT WITH CHECK (get_perfil_atual() = 'ADM');

CREATE POLICY "adm_update_usuario" ON usuarios
  FOR UPDATE USING (get_perfil_atual() = 'ADM');

-- ── Configuração financeira ──

-- Todos autenticados leem (necessário para calcular limite de orçamento)
CREATE POLICY "todos_leem_config" ON configuracao_financeira
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Apenas ADM altera
CREATE POLICY "adm_gerencia_config" ON configuracao_financeira
  FOR ALL USING (get_perfil_atual() = 'ADM');

-- ── Produtos e componentes do catálogo ──

-- Todos autenticados leem catálogo ativo
CREATE POLICY "todos_leem_produtos" ON produtos
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = TRUE);

CREATE POLICY "todos_leem_comp_catalogo" ON produto_componentes
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = TRUE);

CREATE POLICY "todos_leem_serv_catalogo" ON produto_servicos
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = TRUE);

-- Apenas ADM gerencia catálogo
CREATE POLICY "adm_gerencia_produtos" ON produtos
  FOR ALL USING (get_perfil_atual() = 'ADM');

CREATE POLICY "adm_gerencia_comp_catalogo" ON produto_componentes
  FOR ALL USING (get_perfil_atual() = 'ADM');

CREATE POLICY "adm_gerencia_serv_catalogo" ON produto_servicos
  FOR ALL USING (get_perfil_atual() = 'ADM');

-- ── Propostas ──

-- Comercial: vê apenas as suas
CREATE POLICY "comercial_ver_propria_proposta" ON propostas
  FOR SELECT USING (
    get_perfil_atual() = 'Comercial' AND criado_por_usuario_id = auth.uid()
  );

-- Gestor e ADM: veem todas
CREATE POLICY "gestor_adm_ver_todas_propostas" ON propostas
  FOR SELECT USING (
    get_perfil_atual() IN ('Gestor', 'ADM')
  );

-- Qualquer perfil pode criar proposta
CREATE POLICY "todos_criam_proposta" ON propostas
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND criado_por_usuario_id = auth.uid()
  );

-- Dono pode editar proposta (enquanto não for Pronta_pdf ou Cancelada)
CREATE POLICY "dono_edita_proposta" ON propostas
  FOR UPDATE USING (
    criado_por_usuario_id = auth.uid()
    AND status NOT IN ('Pronta_pdf', 'Cancelada')
  );

-- Gestor e ADM podem editar qualquer proposta
CREATE POLICY "gestor_adm_edita_proposta" ON propostas
  FOR UPDATE USING (get_perfil_atual() IN ('Gestor', 'ADM'));

-- ── Proposta produtos / componentes / serviços ──
-- Seguem a mesma lógica da proposta pai

CREATE POLICY "ver_proposta_produtos" ON proposta_produtos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
    )
  );

CREATE POLICY "editar_proposta_produtos" ON proposta_produtos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Pronta_pdf', 'Cancelada')
    )
  );

CREATE POLICY "ver_proposta_componentes" ON proposta_componentes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
    )
  );

CREATE POLICY "editar_proposta_componentes" ON proposta_componentes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Pronta_pdf', 'Cancelada')
    )
  );

CREATE POLICY "ver_proposta_servicos" ON proposta_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
    )
  );

CREATE POLICY "editar_proposta_servicos" ON proposta_servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Pronta_pdf', 'Cancelada')
    )
  );

-- ── Aprovação de exceção ──

-- Gestor e ADM gerenciam aprovações
CREATE POLICY "gestor_adm_aprovacao" ON aprovacao_excecao_margem
  FOR ALL USING (get_perfil_atual() IN ('Gestor', 'ADM'));

-- Comercial pode ver aprovações das suas propostas
CREATE POLICY "comercial_ver_aprovacao" ON aprovacao_excecao_margem
  FOR SELECT USING (solicitado_por_usuario_id = auth.uid());

-- ── Histórico ──

-- Todos veem histórico das propostas que podem ver
CREATE POLICY "ver_historico" ON proposta_historico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
    )
  );

-- Sistema insere histórico (via service role ou trigger)
CREATE POLICY "inserir_historico" ON proposta_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── View financeira: somente Gestor e ADM ───────────────────────────────────
-- A view herda RLS das tabelas base, mas adicionamos segurança extra na camada app.
-- No app: bloquear acesso à view para perfil Comercial.
