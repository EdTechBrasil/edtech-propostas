import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

console.log('Passo 1: adicionando PorProfessorXTema ao enum tipo_calculo...')
const alterSQL = "ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorProfessorXTema';"

const { error: rpcError } = await supabase.rpc('exec_sql', { sql: alterSQL })
if (!rpcError) {
  console.log('  OK: ALTER TYPE via RPC')
} else {
  console.log('  RPC nao disponivel, tentando Management API...')
  const ref = 'qtdmtdetepebqcpzcsdx'
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ query: alterSQL }),
  })
  if (res.ok) {
    console.log('  OK: ALTER TYPE via Management API')
  } else {
    const body = await res.text()
    console.error('  ERRO:', body)
    process.exit(1)
  }
}

console.log('Passo 2: inserindo componente Guia do Professor...')
const { data: produto, error: errP } = await supabase
  .from('produtos').select('id, nome').ilike('nome', '%Meu Primeiro Codigo%').single()

if (errP || !produto) {
  const { data: produto2, error: errP2 } = await supabase
    .from('produtos').select('id, nome').ilike('nome', '%Meu Primeiro C%').single()
  if (errP2 || !produto2) { console.error('Produto nao encontrado'); process.exit(1) }
  Object.assign(produto || {}, produto2)
}

const { data: p } = await supabase.from('produtos').select('id, nome').ilike('nome', '%Primeiro%').single()
if (!p) { console.error('Produto nao encontrado'); process.exit(1) }
console.log('  Produto:', p.nome)

const { data: existing } = await supabase.from('produto_componentes')
  .select('id').eq('produto_id', p.id).eq('nome', 'Guia do Professor').maybeSingle()
if (existing) { console.log('  Componente ja existe'); process.exit(0) }

const { error: errC } = await supabase.from('produto_componentes').insert({
  produto_id: p.id, nome: 'Guia do Professor', categoria: 'Livro',
  tipo_calculo: 'PorProfessorXTema', valor_venda_base: 0, custo_interno_base: 0,
  obrigatorio: true, ativo: true,
})
if (errC) { console.error('Erro ao inserir:', errC.message); process.exit(1) }
console.log('  OK: Guia do Professor inserido!')
console.log('Migration 007 concluida!')
