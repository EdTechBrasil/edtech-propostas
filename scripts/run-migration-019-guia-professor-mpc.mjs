import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.argv[2] ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('Forneça a service role key como argumento ou env SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

console.log('Migration 019: Inserir Guia do Professor em propostas existentes do MPC...')

// 1. Busca o produto_componente "Guia do Professor" do MPC
const { data: comp, error: compErr } = await supabase
  .from('produto_componentes')
  .select('id, produto_id, nome, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio')
  .eq('nome', 'Guia do Professor')
  .eq('tipo_calculo', 'PorProfessorXTema')
  .single()

if (compErr || !comp) {
  console.error('❌ Componente "Guia do Professor" não encontrado:', compErr?.message)
  process.exit(1)
}

console.log(`✅ Componente encontrado: ${comp.id} (produto_id: ${comp.produto_id})`)

// 2. Busca todos os proposta_produtos do MPC que ainda não têm o componente
const { data: pps, error: ppsErr } = await supabase
  .from('proposta_produtos')
  .select('id, proposta_id')
  .eq('produto_id', comp.produto_id)

if (ppsErr) { console.error('❌', ppsErr.message); process.exit(1) }
if (!pps || pps.length === 0) {
  console.log('ℹ️  Nenhuma proposta com MPC encontrada')
  process.exit(0)
}

console.log(`📋 ${pps.length} proposta(s) com MPC encontradas`)

// 3. Filtra proposta_produtos que já têm o Guia do Professor
const { data: existing, error: existErr } = await supabase
  .from('proposta_componentes')
  .select('proposta_produto_id')
  .eq('produto_componente_id', comp.id)
  .in('proposta_produto_id', pps.map(p => p.id))

if (existErr) { console.error('❌', existErr.message); process.exit(1) }

const existingIds = new Set((existing ?? []).map(e => e.proposta_produto_id))
const toInsert = pps.filter(p => !existingIds.has(p.id))

if (toInsert.length === 0) {
  console.log('ℹ️  Todas as propostas já têm o Guia do Professor')
  process.exit(0)
}

console.log(`➕ Inserindo em ${toInsert.length} proposta(s)...`)

const inserts = toInsert.map(p => ({
  proposta_id: p.proposta_id,
  proposta_produto_id: p.id,
  produto_componente_id: comp.id,
  quantidade: 0,
  valor_venda_unit: comp.valor_venda_base,
  custo_interno_unit: comp.custo_interno_base,
  desconto_percent: 0,
  obrigatorio: comp.obrigatorio,
}))

const { error: insertErr } = await supabase
  .from('proposta_componentes')
  .insert(inserts)

if (insertErr) { console.error('❌', insertErr.message); process.exit(1) }

console.log(`✅ Guia do Professor inserido em ${toInsert.length} proposta(s)`)
