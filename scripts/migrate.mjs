/**
 * Script de migração: aplica 002_seed_data + 003_public_fields no Supabase.
 * Uso: node scripts/migrate.mjs <SERVICE_ROLE_KEY>
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.argv[2] ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('Forneça a service role key como argumento ou env SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ok(label)  { console.log(`  ✅ ${label}`) }
function err(label) { console.error(`  ❌ ${label}`) }
function info(label){ console.log(`  ℹ️  ${label}`) }

async function checkColumnExists(table, column) {
  const { error } = await supabase.from(table).select(column).limit(0)
  return !error
}

async function execSQL(sql) {
  // Tenta via rpc 'exec_sql' (função criada por alguns projetos)
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (!error) return { ok: true }

  // Tenta via Management API (requer personal access token — pode não funcionar com service_role)
  const ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  if (res.ok) return { ok: true }
  const body = await res.text()
  return { ok: false, error: body }
}

// ─── Migration 003: ALTER TABLE propostas ─────────────────────────────────────

async function applyMigration003() {
  console.log('\n📋 Migration 003: campos numéricos de público...')

  const already = await checkColumnExists('propostas', 'num_professores')
  if (already) {
    ok('Colunas num_escolas/num_alunos/num_professores já existem — pulando')
    return true
  }

  info('Colunas não existem — tentando adicionar via Management API...')
  const sql = `
    ALTER TABLE propostas
      ADD COLUMN IF NOT EXISTS num_escolas     INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS num_alunos      INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS num_professores INTEGER NOT NULL DEFAULT 0;
  `
  const result = await execSQL(sql)
  if (result.ok) {
    ok('ALTER TABLE aplicado com sucesso')
    return true
  }

  err('Não foi possível aplicar via API. Execute manualmente no Supabase SQL Editor:')
  console.log('\n--- COPIE E COLE NO SQL EDITOR DO SUPABASE ---')
  console.log(sql.trim())
  console.log('--- FIM ---\n')
  return false
}

// ─── Migration 002: Seed dos 13 produtos ─────────────────────────────────────

const PRODUTOS = [
  { nome: 'CuriosaMente',                  descricao: 'Formação presencial de 4h para até 100 participantes. 1 pedagogo formador.' },
  { nome: 'Meu Primeiro Código',           descricao: 'Formação presencial de 8h para até 50 participantes. 2 formadores (pedagogo + tech). Inclui kit de hardware.' },
  { nome: 'Coding',                        descricao: 'Formação presencial de 4h para até 30 participantes. 2 formadores (tech + assistente).' },
  { nome: 'SAEB Brasil',                   descricao: 'Formação presencial de 8h para 30–50 participantes. 2 a 3 especialistas.' },
  { nome: 'Edtech Arduino',                descricao: 'Formação presencial de 8h para até 50 participantes. 2 formadores. Inclui kit Arduino.' },
  { nome: 'Edtech IA',                     descricao: 'Formação presencial de 8h para até 30 participantes. 2 especialistas em IA. Inclui kit/software.' },
  { nome: 'Cultura Digital e Programação', descricao: 'Formação presencial de 4h para até 60 participantes. 1 formador tech.' },
  { nome: 'EJA',                           descricao: 'Formação presencial de 4h para até 100 participantes. 1 pedagogo formador.' },
  { nome: 'ENEM',                          descricao: 'Formação presencial de 8h para até 100 participantes. 4 pedagogos + palestrante convidado.' },
  { nome: 'SEPPO',                         descricao: 'Formação presencial de 6h em 2 encontros para até 50 participantes. Inclui licença de plataforma.' },
  { nome: 'MAXIA',                         descricao: 'Formação presencial de 4h em 2 encontros para até 30 participantes. Inclui licença de plataforma.' },
  { nome: 'SAEB Evoluir',                  descricao: 'Formação intensiva de 20h para até 50 participantes. 5 pedagogos. Inclui plataforma Kóleos.' },
  { nome: 'CODMOS',                        descricao: 'Formação presencial de 4h para até 50 participantes. 1 formador tech. Inclui licença de plataforma.' },
]

// Serviços base (iguais para todos os produtos — sobrescritos onde necessário)
function servicosBase(horas) {
  return [
    { nome: `Formação Presencial (${horas})`, tipo_calculo: 'Fixo',         obrigatorio: true,  valor_venda_base: 0, custo_interno_base: 0 },
    { nome: 'Formação EAD',                   tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 },
    { nome: 'Assessoria Pedagógica',          tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 },
    { nome: 'Honorário do Formador',          tipo_calculo: 'Fixo',         obrigatorio: true,  valor_venda_base: 0, custo_interno_base: 130 },
    { nome: 'Hospedagem',                     tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0, custo_interno_base: 300 },
    { nome: 'Alimentação',                    tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0, custo_interno_base: 100 },
    { nome: 'Kit Lanche',                     tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 15 },
    { nome: 'Caneta',                         tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 5 },
    { nome: 'Bloco de Anotação',              tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 5 },
    { nome: 'Deslocamento',                   tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 },
  ]
}

// Overrides e componentes por produto
const EXTRAS = {
  'CuriosaMente':                  { horas: '4h',           servicos_extra: [],                                                               componentes: [] },
  'Meu Primeiro Código':           { horas: '8h',           servicos_extra: [],                                                               componentes: [{ nome: 'Kit de Hardware',              categoria: 'Kit',       tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'Coding':                        { horas: '4h',           servicos_extra: [],                                                               componentes: [] },
  'SAEB Brasil':                   { horas: '8h',           servicos_extra: [],                                                               componentes: [] },
  'Edtech Arduino':                { horas: '8h',           servicos_extra: [],                                                               componentes: [{ nome: 'Kit Arduino',                  categoria: 'Kit',       tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'Edtech IA':                     { horas: '8h',           servicos_extra: [],                                                               componentes: [{ nome: 'Kit de Software/Hardware IA',  categoria: 'Kit',       tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'Cultura Digital e Programação': { horas: '4h',           servicos_extra: [],                                                               componentes: [] },
  'EJA':                           { horas: '4h',           servicos_extra: [],                                                               componentes: [] },
  'ENEM':                          { horas: '8h',           servicos_extra: [{ nome: 'Palestrante Convidado', tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 10000 }], componentes: [] },
  'SEPPO':                         { horas: '6h/2 encontros', servicos_extra: [],                                                             componentes: [{ nome: 'Licença Plataforma SEPPO',    categoria: 'Plataforma', tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'MAXIA':                         { horas: '4h/2 encontros', servicos_extra: [],                                                             componentes: [{ nome: 'Licença Plataforma MAXIA',    categoria: 'Plataforma', tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'SAEB Evoluir':                  { horas: '20h',          servicos_extra: [],                                                               componentes: [{ nome: 'Plataforma Kóleos',           categoria: 'Plataforma', tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
  'CODMOS':                        { horas: '4h',           servicos_extra: [],                                                               componentes: [{ nome: 'Licença Plataforma CODMOS',   categoria: 'Plataforma', tipo_calculo: 'Fixo', obrigatorio: false, valor_venda_base: 0, custo_interno_base: 0 }] },
}

async function applyMigration002() {
  console.log('\n📋 Migration 002: seed dos 13 produtos...')

  // Verifica se já existem produtos
  const { data: existing } = await supabase.from('produtos').select('nome').eq('ativo', true)

  if (existing && existing.length >= 13) {
    ok(`${existing.length} produtos já cadastrados — pulando seed`)
    return true
  }

  const existingNames = new Set((existing ?? []).map(p => p.nome))

  for (const produto of PRODUTOS) {
    if (existingNames.has(produto.nome)) {
      info(`${produto.nome} já existe — pulando`)
      continue
    }

    // Insere produto
    const { data: novoProduto, error: errP } = await supabase
      .from('produtos')
      .insert({ nome: produto.nome, descricao: produto.descricao, ativo: true })
      .select('id')
      .single()

    if (errP || !novoProduto) {
      err(`Falha ao inserir produto "${produto.nome}": ${errP?.message}`)
      continue
    }

    const extra = EXTRAS[produto.nome]
    const servicos = [
      ...servicosBase(extra.horas),
      ...extra.servicos_extra,
    ]

    // Insere serviços
    const { error: errS } = await supabase.from('produto_servicos').insert(
      servicos.map(s => ({ ...s, produto_id: novoProduto.id, ativo: true }))
    )
    if (errS) err(`  Serviços de "${produto.nome}": ${errS.message}`)

    // Insere componentes
    if (extra.componentes.length > 0) {
      const { error: errC } = await supabase.from('produto_componentes').insert(
        extra.componentes.map(c => ({ ...c, produto_id: novoProduto.id, ativo: true }))
      )
      if (errC) err(`  Componentes de "${produto.nome}": ${errC.message}`)
    }

    ok(`${produto.nome} — ${servicos.length} serviços, ${extra.componentes.length} componentes`)
  }

  return true
}

// ─── Teste pós-migração ───────────────────────────────────────────────────────

async function verificar() {
  console.log('\n🔍 Verificando resultados...')

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    err(`Erro ao verificar: ${error.message}`)
    return
  }

  console.log(`\n  Total de produtos: ${produtos.length}`)
  for (const p of produtos) {
    const [{ count: nServ }, { count: nComp }] = await Promise.all([
      supabase.from('produto_servicos').select('*', { count: 'exact', head: true }).eq('produto_id', p.id).eq('ativo', true),
      supabase.from('produto_componentes').select('*', { count: 'exact', head: true }).eq('produto_id', p.id).eq('ativo', true),
    ])
    console.log(`  • ${p.nome.padEnd(32)} ${String(nServ ?? 0).padStart(2)} serv  ${String(nComp ?? 0).padStart(2)} comp`)
  }

  // Verifica colunas num_*
  const colExists = await checkColumnExists('propostas', 'num_professores')
  if (colExists) {
    ok('Colunas num_escolas/num_alunos/num_professores presentes na tabela propostas')
  } else {
    err('Colunas num_* ainda NÃO existem — execute migration 003 manualmente')
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('🚀 Iniciando migrations EdTech Propostas...')

  const m003ok = await applyMigration003()
  await applyMigration002()
  await verificar()

  if (!m003ok) {
    console.log('\n⚠️  Migration 003 precisa ser aplicada manualmente (ver SQL acima)')
    console.log('   Após rodar o SQL no dashboard, execute este script novamente para verificar.')
  } else {
    console.log('\n✅ Tudo pronto!')
  }
})()
