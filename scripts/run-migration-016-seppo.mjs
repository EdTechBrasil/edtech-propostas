// scripts/run-migration-016-seppo.mjs
// Configura componentes e serviços do produto SEPPO Gamificação

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

const { data: prod } = await supabase.from('produtos').select('id, nome').ilike('nome', '%SEPPO%').single()
if (!prod) { console.error('SEPPO não encontrado'); process.exit(1) }
console.log('Produto:', prod.nome, prod.id)

// 1. Deletar componentes genéricos existentes
const { data: existing } = await supabase.from('produto_componentes').select('id, nome').eq('produto_id', prod.id)
console.log('\nComponentes existentes:', existing?.map(c => c.nome))
if (existing?.length) {
  const { error } = await supabase.from('produto_componentes').delete().eq('produto_id', prod.id)
  console.log('Deletar existentes:', error ? error.message : 'OK')
}

// 2. Inserir componentes corretos
const componentes = [
  { nome: 'Plataforma de Games',      categoria: 'Plataforma', tipo_calculo: 'PorAluno',     obrigatorio: true,  valor: 70.00,   ordem: 1 },
  { nome: 'Licenças Seppo',           categoria: 'Plataforma', tipo_calculo: 'PorProfessor',  obrigatorio: true,  valor: 150.00,  ordem: 2 },
  { nome: 'Formação em Gamificação',  categoria: 'Kit',        tipo_calculo: 'PorProfessor',  obrigatorio: true,  valor: 450.00,  ordem: 3 },
  { nome: 'Conteúdos Personalizados', categoria: 'Kit',        tipo_calculo: 'PorEscola',     obrigatorio: false, valor: 1800.00, ordem: 4 },
]

for (const c of componentes) {
  const { error } = await supabase.from('produto_componentes').insert({
    produto_id: prod.id, nome: c.nome, categoria: c.categoria,
    tipo_calculo: c.tipo_calculo, obrigatorio: c.obrigatorio,
    valor_venda_base: c.valor, custo_interno_base: 0, ativo: true, ordem: c.ordem,
  })
  console.log(error ? 'ERRO ' + c.nome + ': ' + error.message : 'Inserido: ' + c.nome + ' R$ ' + c.valor)
}

// 3. Deletar serviços genéricos (valor zero)
const { data: servs } = await supabase.from('produto_servicos').select('id, nome, valor_venda_base').eq('produto_id', prod.id)
console.log('\nServiços existentes:', servs?.map(s => `${s.nome} R$${s.valor_venda_base}`))
const zerados = (servs ?? []).filter(s => s.valor_venda_base === 0)
if (zerados.length) {
  // Verificar dependências
  for (const s of zerados) {
    const { data: deps } = await supabase.from('proposta_servicos').select('id').eq('servico_id', s.id).limit(1)
    if (deps?.length) {
      await supabase.from('proposta_servicos').delete().eq('servico_id', s.id)
    }
  }
  const { error } = await supabase.from('produto_servicos').delete().in('id', zerados.map(s => s.id))
  console.log('Deletar serviços zerados:', error ? error.message : `${zerados.length} deletados`)
}

console.log('\nMigration SEPPO concluída.')
