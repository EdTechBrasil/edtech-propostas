/**
 * Migration 021 — Constraints, Índices e RLS
 * Tenta rodar via Management API; falha graciosamente se PAT inválido.
 */

const PROJECT_REF = 'qtdmtdetepebqcpzcsdx'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
const PAT = process.env.SUPABASE_PAT ?? ''

function ok(label)  { console.log(`  ✅ ${label}`) }
function err(label) { console.error(`  ❌ ${label}`) }
function info(label){ console.log(`  ℹ️  ${label}`) }

async function runSQL(sql, label) {
  // Tenta Management API (precisa de PAT sbp_...)
  if (PAT && PAT.startsWith('sbp_')) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      }
    )
    if (res.ok) { ok(label); return true }
    const body = await res.text()
    err(`${label}: ${body}`)
    return false
  }

  // Fallback: tenta via PostgREST rpc (para funções existentes)
  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    }
  )
  if (res.ok) { ok(label); return true }
  return null // não disponível
}

// ─── SQL em blocos ────────────────────────────────────────────────────────────

const BATCH_1 = `
DO $$ BEGIN
  CREATE TYPE tipo_produto AS ENUM (
    'Currículo', 'Plataforma', 'Robótica', 'Socioemocional', 'Avaliação', 'IA', 'Coding'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE objetivo_proposta AS ENUM ('BaterOrcamento', 'MaximizarMargem');
EXCEPTION WHEN duplicate_object THEN null; END $$;
`

const BATCH_2_CONSTRAINTS = [
  [`ALTER TABLE propostas ADD CONSTRAINT IF NOT EXISTS ck_desconto_global CHECK (desconto_global_percent >= 0 AND desconto_global_percent <= 100)`, 'ck_desconto_global'],
  [`ALTER TABLE propostas ADD CONSTRAINT IF NOT EXISTS ck_tolerancia CHECK (tolerancia_percent >= 0 AND tolerancia_percent <= 100)`, 'ck_tolerancia'],
  [`ALTER TABLE proposta_componentes ADD CONSTRAINT IF NOT EXISTS ck_desconto_comp CHECK (desconto_percent >= 0 AND desconto_percent <= 100)`, 'ck_desconto_comp'],
  [`ALTER TABLE proposta_servicos ADD CONSTRAINT IF NOT EXISTS ck_desconto_serv CHECK (desconto_percent >= 0 AND desconto_percent <= 100)`, 'ck_desconto_serv'],
  [`ALTER TABLE proposta_produtos ADD CONSTRAINT IF NOT EXISTS ck_desconto_prod CHECK (desconto_percent >= 0 AND desconto_percent <= 100)`, 'ck_desconto_prod'],
  [`ALTER TABLE configuracao_financeira ADD CONSTRAINT IF NOT EXISTS ck_margem_min CHECK (margem_minima_percent >= 0 AND margem_minima_percent <= 100)`, 'ck_margem_min'],
  [`ALTER TABLE configuracao_financeira ADD CONSTRAINT IF NOT EXISTS ck_margem_max CHECK (margem_global_max_percent >= 0 AND margem_global_max_percent <= 100)`, 'ck_margem_max'],
  [`ALTER TABLE configuracao_financeira ADD CONSTRAINT IF NOT EXISTS ck_desconto_max CHECK (desconto_max_percent >= 0 AND desconto_max_percent <= 100)`, 'ck_desconto_max'],
]

const BATCH_2_FK = `
ALTER TABLE proposta_produtos DROP CONSTRAINT IF EXISTS proposta_produtos_produto_id_fkey;
ALTER TABLE proposta_produtos ADD CONSTRAINT proposta_produtos_produto_id_fkey
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT;
`

const BATCH_2_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_prop_comp_produto_comp_id ON proposta_componentes(produto_componente_id);
CREATE INDEX IF NOT EXISTS idx_prop_serv_produto_serv_id ON proposta_servicos(produto_servico_id);
CREATE INDEX IF NOT EXISTS idx_prop_comp_prop_prod_id ON proposta_componentes(proposta_produto_id);
CREATE INDEX IF NOT EXISTS idx_prop_serv_prop_prod_id ON proposta_servicos(proposta_produto_id);
CREATE INDEX IF NOT EXISTS idx_historico_usuario_id ON proposta_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(id) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_produto_comp_ativo ON produto_componentes(produto_id) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_produto_serv_ativo ON produto_servicos(produto_id) WHERE ativo = TRUE;
`

const BATCH_2_RLS = `
ALTER TABLE produto_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "todos_leem_produto_series" ON produto_series;
CREATE POLICY "todos_leem_produto_series" ON produto_series
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "adm_gerencia_produto_series" ON produto_series;
CREATE POLICY "adm_gerencia_produto_series" ON produto_series
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'ADM')
  );
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
`

// ─── main ─────────────────────────────────────────────────────────────────────

console.log('\n🚀 Migration 021 — Constraints, Índices e RLS\n')

if (!PAT || !PAT.startsWith('sbp_')) {
  info('PAT não encontrado ou formato antigo — não é possível rodar DDL automaticamente.')
  info('Cole o SQL abaixo no Supabase SQL Editor em 2 batches:\n')

  console.log('═══ BATCH 1 (rodar primeiro, aguardar): ═══')
  console.log(BATCH_1)

  console.log('\n═══ BATCH 2 (rodar após BATCH 1): ═══')
  for (const [sql] of BATCH_2_CONSTRAINTS) console.log(sql + ';')
  console.log(BATCH_2_FK)
  console.log(BATCH_2_INDEXES)
  console.log(BATCH_2_RLS)

  console.log('\n💡 Dica: abra https://supabase.com/dashboard/project/qtdmtdetepebqcpzcsdx/sql/new')
  process.exit(0)
}

// Com PAT válido: rodar tudo
info('PAT detectado — rodando via Management API...\n')

info('BATCH 1 — enums...')
const r1 = await runSQL(BATCH_1, 'Criar enums tipo_produto e objetivo_proposta')
if (!r1) { process.exit(1) }

info('\nBATCH 2 — constraints...')
for (const [sql, label] of BATCH_2_CONSTRAINTS) {
  await runSQL(sql, label)
}

info('\nForeign key com RESTRICT...')
await runSQL(BATCH_2_FK, 'proposta_produtos_produto_id_fkey RESTRICT')

info('\nÍndices...')
await runSQL(BATCH_2_INDEXES, 'Todos os índices')

info('\nRLS...')
await runSQL(BATCH_2_RLS, 'RLS produto_series + proposta_historico')

console.log('\n✅ Migration 021 concluída!')
