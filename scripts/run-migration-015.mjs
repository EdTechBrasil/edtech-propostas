// scripts/run-migration-015.mjs
// Roda BATCH 2 (DML) da migration 015: componentes Edtech IA
// Executar APÓS rodar o BATCH 1 (DDL) no SQL Editor

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

const { data: prod } = await supabase.from('produtos').select('id').eq('nome', 'Edtech IA').single()
if (!prod) { console.error('Edtech IA não encontrado'); process.exit(1) }
console.log('Produto Edtech IA:', prod.id)

// 1. Desativar componente antigo
const { error: e0 } = await supabase.from('produto_componentes')
  .update({ ativo: false })
  .eq('produto_id', prod.id).eq('nome', 'Kit de Software/Hardware IA')
console.log('Desativar Kit antigo:', e0 ? e0.message : 'OK')

// 2. Inserir componentes de livros
const componentes = [
  { nome: 'Livros de Conceitos',       categoria: 'Livro', tipo_calculo: 'PorAlunoEProfessorXLivroConceitos', obrigatorio: true,  valor: 160.00, ordem: 1 },
  { nome: 'Livros de Práticas Digitais', categoria: 'Livro', tipo_calculo: 'PorAlunoEProfessorXLivroPraticas',  obrigatorio: false, valor: 240.00, ordem: 2 },
]

for (const c of componentes) {
  const { data: exists } = await supabase.from('produto_componentes').select('id').eq('produto_id', prod.id).eq('nome', c.nome).single()
  if (exists) { console.log('  Já existe:', c.nome); continue }
  const { error } = await supabase.from('produto_componentes').insert({
    produto_id: prod.id, nome: c.nome, categoria: c.categoria,
    tipo_calculo: c.tipo_calculo, obrigatorio: c.obrigatorio,
    valor_venda_base: c.valor, custo_interno_base: 0, ativo: true, ordem: c.ordem,
  })
  console.log(' ', error ? 'ERRO ' + c.nome + ': ' + error.message : 'Inserido: ' + c.nome + ' R$ ' + c.valor)
}

// 3. Atualizar serviços de formação
const servicoUpdates = [
  { pattern: 'ead',        valor: 750.00   },
  { pattern: 'assessoria', valor: 1119.40  },
]
const { data: servs } = await supabase.from('produto_servicos').select('id, nome').eq('produto_id', prod.id)
console.log('\nServiços:')
for (const s of servs ?? []) {
  const match = servicoUpdates.find(u => s.nome.toLowerCase().includes(u.pattern))
  if (!match) continue
  const { error } = await supabase.from('produto_servicos').update({ valor_venda_base: match.valor }).eq('id', s.id)
  console.log(' ', error ? 'ERRO: ' + error.message : s.nome + ' -> R$ ' + match.valor)
}

console.log('\nMigration 015 (DML) concluída.')
