// Insere o produto SAEB Brasil com serviços, componentes e produto_series.
// Uso: node scripts/run-migration-saeb.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

const NOME = 'SAEB Brasil'

// ── 1. Produto ────────────────────────────────────────────────────────────────
let produtoId

const { data: existing } = await sb.from('produtos').select('id').eq('nome', NOME).single()
if (existing) {
  console.log(`⚠️  Produto já existe (id: ${existing.id}) — pulando INSERT de produto`)
  produtoId = existing.id
} else {
  const { data: novo, error: errProd } = await sb
    .from('produtos')
    .insert({ nome: NOME, descricao: 'Avaliação SAEB para Anos Iniciais (1º e 2º ANO).', ativo: true, tipo: 'Currículo' })
    .select('id')
    .single()
  if (errProd) { console.error('❌ Erro ao inserir produto:', errProd.message); process.exit(1) }
  produtoId = novo.id
  console.log(`✅ Produto inserido (id: ${produtoId})`)
}

// ── 2. Serviços ───────────────────────────────────────────────────────────────
await sb.from('produto_servicos').delete().eq('produto_id', produtoId)

const servicos = [
  { nome: 'Formação Presencial (8h)', tipo_calculo: 'Fixo',         obrigatorio: true,  valor_venda_base: 1149.40, custo_interno_base: 0,   ordem: 1 },
  { nome: 'Formação EAD',             tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 750.00,  custo_interno_base: 0,   ordem: 2 },
  { nome: 'Assessoria Pedagógica',    tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 1119.40, custo_interno_base: 0,   ordem: 3 },
  { nome: 'Honorário do Formador',    tipo_calculo: 'Fixo',         obrigatorio: true,  valor_venda_base: 0,       custo_interno_base: 130, ordem: 4 },
  { nome: 'Hospedagem',               tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 300, ordem: 5 },
  { nome: 'Alimentação',              tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 100, ordem: 6 },
  { nome: 'Kit Lanche',               tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 15,  ordem: 7 },
  { nome: 'Caneta',                   tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 5,   ordem: 8 },
  { nome: 'Bloco de Anotação',        tipo_calculo: 'PorProfessor', obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 5,   ordem: 9 },
  { nome: 'Deslocamento',             tipo_calculo: 'Fixo',         obrigatorio: false, valor_venda_base: 0,       custo_interno_base: 0,   ordem: 10 },
].map(s => ({ ...s, produto_id: produtoId, ativo: true }))

const { error: errServ } = await sb.from('produto_servicos').insert(servicos)
if (errServ) { console.error('❌ Erro ao inserir serviços:', errServ.message); process.exit(1) }
console.log(`✅ ${servicos.length} serviços inseridos`)

// ── 3. Componentes ────────────────────────────────────────────────────────────
await sb.from('produto_componentes').delete().eq('produto_id', produtoId)

const componentes = [
  // 1º ANO
  { nome: 'Saeb - Língua Portuguesa (1º ANO)', ordem: 1, valor_venda_base: 232.20 },
  { nome: 'Saeb - Ciências (1º ANO)',           ordem: 2, valor_venda_base: 183.60 },
  { nome: 'Saeb - Matemática (1º ANO)',          ordem: 3, valor_venda_base: 442.80 },
  { nome: 'Simulado (1º ANO)',                   ordem: 4, valor_venda_base: 102.60 },
  // 2º ANO
  { nome: 'Saeb - Língua Portuguesa (2º ANO)', ordem: 5, valor_venda_base: 270.00 },
  { nome: 'Saeb - Ciências (2º ANO)',           ordem: 6, valor_venda_base: 172.80 },
  { nome: 'Saeb - Matemática (2º ANO)',          ordem: 7, valor_venda_base: 426.60 },
  { nome: 'Simulado (2º ANO)',                   ordem: 8, valor_venda_base: 102.60 },
].map(c => ({
  ...c,
  produto_id: produtoId,
  categoria: 'Livro',
  tipo_calculo: 'PorAluno',
  custo_interno_base: 0,
  obrigatorio: true,
  ativo: true,
}))

const { error: errComp } = await sb.from('produto_componentes').insert(componentes)
if (errComp) { console.error('❌ Erro ao inserir componentes:', errComp.message); process.exit(1) }
console.log(`✅ ${componentes.length} componentes inseridos`)

// ── 4. Séries ─────────────────────────────────────────────────────────────────
await sb.from('produto_series').delete().eq('produto_id', produtoId)

const series = ['ano1', 'ano2'].map(serie => ({ produto_id: produtoId, serie }))
const { error: errSeries } = await sb.from('produto_series').insert(series)
if (errSeries) { console.error('❌ Erro ao inserir séries:', errSeries.message); process.exit(1) }
console.log(`✅ Séries: [ano1, ano2]`)

console.log('\n🎉 SAEB Brasil cadastrado com sucesso.')
