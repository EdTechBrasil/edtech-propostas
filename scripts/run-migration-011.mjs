/**
 * Migration 011: DML — Insert tapete components per série (Ano1/2/3) + deactivate Tapete1a3
 *
 * Pré-requisito: rodar BATCH 1 do arquivo 011_series_por_aluno.sql no SQL Editor ANTES deste script.
 *
 * Uso: node scripts/run-migration-011.mjs
 */

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

function ok(msg)   { console.log(`  ✅ ${msg}`) }
function err(msg)  { console.error(`  ❌ ${msg}`) }
function info(msg) { console.log(`  ℹ️  ${msg}`) }

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

async function checkEnumValue(value) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/produto_componentes?select=tipo_calculo&tipo_calculo=eq.${value}&limit=0`,
    { headers }
  )
  // 200 = enum existe (mesmo sem linhas); 400 = enum não existe
  return res.ok
}

async function getMeuPrimeiroCodigo() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/produtos?nome=ilike.*Primeiro*&ativo=eq.true&select=id,nome`,
    { headers }
  )
  if (!res.ok) { err(`Falha ao buscar produto: ${await res.text()}`); return null }
  const rows = await res.json()
  if (!rows.length) { err('Produto "Meu Primeiro Código" não encontrado'); return null }
  return rows[0]
}

async function componenteExiste(produto_id, nome) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/produto_componentes?produto_id=eq.${produto_id}&nome=eq.${encodeURIComponent(nome)}&select=id`,
    { headers }
  )
  const rows = await res.json()
  return rows.length > 0
}

async function inserirTapete(produto_id, nome, tipo_calculo) {
  if (await componenteExiste(produto_id, nome)) {
    info(`${nome} já existe — pulando`)
    return
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/produto_componentes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      produto_id,
      nome,
      categoria: 'Kit',
      tipo_calculo,
      obrigatorio: false,
      valor_venda_base: 0,
      custo_interno_base: 0,
      ativo: true,
    }),
  })
  if (res.ok) ok(`Inserido: ${nome} (${tipo_calculo})`)
  else err(`Falha ao inserir ${nome}: ${await res.text()}`)
}

async function desativarTapete1a3(produto_id) {
  // Busca o componente Tapete1a3 ativo
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/produto_componentes?produto_id=eq.${produto_id}&tipo_calculo=eq.Tapete1a3&ativo=eq.true&select=id,nome`,
    { headers }
  )
  const rows = await res.json()
  if (!rows.length) { info('Tapete1a3 já está inativo ou não existe'); return }

  const ids = rows.map(r => r.id).join(',')
  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/produto_componentes?id=in.(${ids})`,
    { method: 'PATCH', headers, body: JSON.stringify({ ativo: false }) }
  )
  if (patch.ok) ok(`Desativado Tapete1a3 (${rows.length} registro(s))`)
  else err(`Falha ao desativar Tapete1a3: ${await patch.text()}`)
}

;(async () => {
  console.log('\n🚀 Migration 011: Séries por aluno (DML)\n')

  // 1. Verificar enums
  for (const v of ['TapeteAno1', 'TapeteAno2', 'TapeteAno3']) {
    const exists = await checkEnumValue(v)
    if (!exists) {
      err(`Enum ${v} não encontrado — rode BATCH 1 no SQL Editor primeiro!`)
      process.exit(1)
    }
    info(`Enum ${v} ok`)
  }

  // 2. Buscar produto
  const produto = await getMeuPrimeiroCodigo()
  if (!produto) process.exit(1)
  info(`Produto encontrado: ${produto.nome} (${produto.id})`)

  // 3. Inserir componentes de tapete por série
  await inserirTapete(produto.id, 'Tapetes - 1ª série', 'TapeteAno1')
  await inserirTapete(produto.id, 'Tapetes - 2ª série', 'TapeteAno2')
  await inserirTapete(produto.id, 'Tapetes - 3ª série', 'TapeteAno3')

  // 4. Desativar Tapete1a3
  await desativarTapete1a3(produto.id)

  console.log('\n✅ Migration 011 DML concluída!\n')
})()
