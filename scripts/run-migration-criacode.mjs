import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

const { data: produto } = await sb.from('produtos').select('id').eq('nome', 'Cria+Code - BNCC da Computação').single()
if (!produto) { console.log('Produto não encontrado'); process.exit(1) }
console.log('Cria+Code id:', produto.id)

await sb.from('produto_componentes').delete().eq('produto_id', produto.id)

const componentes = [
  { nome: 'Livros do Aluno',     categoria: 'Livro', tipo_calculo: 'PorAlunoXTema',     valor_venda_base: 80,  custo_interno_base: 0, obrigatorio: true, ordem: 1 },
  { nome: 'Livros do Professor', categoria: 'Livro', tipo_calculo: 'PorProfessorXTema', valor_venda_base: 160, custo_interno_base: 0, obrigatorio: true, ordem: 2 },
].map(c => ({ ...c, produto_id: produto.id, ativo: true }))

const { error } = await sb.from('produto_componentes').insert(componentes)
if (error) { console.log('ERRO:', error.message); process.exit(1) }
console.log('✅ 2 componentes do Cria+Code inseridos com sucesso')
