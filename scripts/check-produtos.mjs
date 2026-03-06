import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

const SKIP = ['Meu Primeiro Código', 'CODMOS', 'Edtech Coding']

const { data: prods } = await supabase.from('produtos').select('id, nome').eq('ativo', true).order('nome')

for (const p of prods) {
  if (SKIP.some(s => p.nome.includes(s))) continue

  const [{ data: comps }, { data: servs }] = await Promise.all([
    supabase.from('produto_componentes').select('nome, tipo_calculo, valor_venda_base').eq('produto_id', p.id).eq('ativo', true),
    supabase.from('produto_servicos').select('nome, tipo_calculo, valor_venda_base, obrigatorio').eq('produto_id', p.id).eq('ativo', true),
  ])

  console.log('\n=== ' + p.nome + ' ===')
  if (comps?.length) {
    console.log('Componentes:')
    comps.forEach(c => console.log('  - ' + c.nome + ' | ' + c.tipo_calculo + ' | R$ ' + c.valor_venda_base))
  } else {
    console.log('Componentes: nenhum')
  }
  const obrig = servs?.filter(s => s.obrigatorio) ?? []
  const opc   = servs?.filter(s => !s.obrigatorio) ?? []
  console.log('Serviços obrigatórios (' + obrig.length + '):')
  obrig.forEach(s => console.log('  - ' + s.nome + ' | R$ ' + s.valor_venda_base))
  console.log('Serviços opcionais (' + opc.length + '):')
  opc.forEach(s => console.log('  - ' + s.nome + ' | R$ ' + s.valor_venda_base))
}
