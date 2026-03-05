/**
 * Corrige produto_servicos com preço embutido no nome e sincroniza proposta_servicos.
 * Uso: node scripts/run-fix-servicos.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const ok  = msg => console.log(`  ✅ ${msg}`)
const err = msg => console.error(`  ❌ ${msg}`)
const inf = msg => console.log(`  ℹ️  ${msg}`)

// ─── SQL 1: limpar nome e corrigir valor_venda_base ───────────────────────────

async function fixProdutoServicos() {
  console.log('\n📋 Passo 1: corrigir produto_servicos com preço no nome...')

  // Busca todos os serviços "Presencial" que têm dígito no nome
  const { data: rows, error } = await supabase
    .from('produto_servicos')
    .select('id, nome, valor_venda_base')
    .ilike('nome', '%Presencial%')

  if (error) { err(`Falha ao buscar: ${error.message}`); return false }
  if (!rows || rows.length === 0) { inf('Nenhum serviço Presencial encontrado'); return true }

  inf(`Encontrados ${rows.length} serviço(s) Presencial`)

  const comDigito = rows.filter(r => /\d/.test(r.nome))
  if (comDigito.length === 0) { ok('Nomes já estão limpos — nada a fazer'); return true }

  for (const row of comDigito) {
    // Remove número (e separadores) do final do nome: ex. "Formação Presencial (8h)1.149,40" → "Formação Presencial (8h)"
    const nomeCorrigido = row.nome.replace(/\s*[\d.,]+$/, '').trim()
    inf(`  "${row.nome}" → "${nomeCorrigido}" | valor_venda_base: ${row.valor_venda_base} → 1149.40`)

    const { error: errU } = await supabase
      .from('produto_servicos')
      .update({ nome: nomeCorrigido, valor_venda_base: 1149.40 })
      .eq('id', row.id)

    if (errU) err(`  Falha ao atualizar id=${row.id}: ${errU.message}`)
    else ok(`  id=${row.id} atualizado`)
  }

  return true
}

// ─── SQL 2: sincronizar proposta_servicos com valor_venda_unit=0 ──────────────

async function syncPropostaServicos() {
  console.log('\n📋 Passo 2: sincronizar proposta_servicos zerados...')

  // Busca produto_servicos com valor_venda_base > 0
  const { data: produtos, error: errP } = await supabase
    .from('produto_servicos')
    .select('id, valor_venda_base')
    .gt('valor_venda_base', 0)

  if (errP) { err(`Falha ao buscar produto_servicos: ${errP.message}`); return false }
  if (!produtos || produtos.length === 0) { inf('Nenhum produto_servico com valor_venda_base > 0'); return true }

  inf(`${produtos.length} produto_servico(s) com valor_venda_base > 0`)

  let totalAtualizado = 0

  for (const ps of produtos) {
    // Busca proposta_servicos zerados para este produto_servico
    const { data: propServicos, error: errQ } = await supabase
      .from('proposta_servicos')
      .select('id')
      .eq('produto_servico_id', ps.id)
      .eq('valor_venda_unit', 0)

    if (errQ) { err(`  Falha ao buscar proposta_servicos para produto_servico_id=${ps.id}: ${errQ.message}`); continue }
    if (!propServicos || propServicos.length === 0) continue

    inf(`  produto_servico_id=${ps.id}: ${propServicos.length} proposta_servico(s) zerados → ${ps.valor_venda_base}`)

    const ids = propServicos.map(r => r.id)
    const { error: errU } = await supabase
      .from('proposta_servicos')
      .update({ valor_venda_unit: ps.valor_venda_base })
      .in('id', ids)

    if (errU) err(`  Falha ao atualizar: ${errU.message}`)
    else { ok(`  ${ids.length} linha(s) atualizadas`); totalAtualizado += ids.length }
  }

  ok(`Total: ${totalAtualizado} proposta_servico(s) sincronizados`)
  return true
}

// ─── Verificação ──────────────────────────────────────────────────────────────

async function verificar() {
  console.log('\n🔍 Verificando resultado final...')

  const { data: ps } = await supabase
    .from('produto_servicos')
    .select('id, nome, valor_venda_base')
    .ilike('nome', '%Presencial%')

  console.log('  produto_servicos Presencial:')
  for (const r of (ps ?? [])) {
    console.log(`    id=${r.id}  nome="${r.nome}"  valor_venda_base=${r.valor_venda_base}`)
  }

  const { data: pp } = await supabase
    .from('proposta_servicos')
    .select('id, produto_servico_id, valor_venda_unit')
    .in('produto_servico_id', (ps ?? []).map(r => r.id))

  console.log('  proposta_servicos associados:')
  for (const r of (pp ?? [])) {
    console.log(`    id=${r.id}  produto_servico_id=${r.produto_servico_id}  valor_venda_unit=${r.valor_venda_unit}`)
  }
}

;(async () => {
  console.log('🚀 Corrigindo serviços com preço no nome...')
  const p1 = await fixProdutoServicos()
  if (p1) await syncPropostaServicos()
  await verificar()
  console.log('\n✅ Concluído!')
})()
