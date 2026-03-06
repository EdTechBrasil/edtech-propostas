import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

const { data: produto } = await sb.from('produtos').select('id').eq('nome', 'ENEM').single()
if (!produto) { console.log('Produto ENEM não encontrado'); process.exit(1) }
console.log('ENEM id:', produto.id)

// Limpar componentes antigos (seed genérico)
const { error: delErr } = await sb.from('produto_componentes').delete().eq('produto_id', produto.id)
if (delErr) { console.log('Erro ao deletar:', delErr.message); process.exit(1) }

const componentes = [
  { nome: 'Material Didático',       categoria: 'Livro',      tipo_calculo: 'PorAluno',     valor_venda_base: 150, custo_interno_base: 0, obrigatorio: true },
  { nome: 'Plataforma Digital',      categoria: 'Plataforma', tipo_calculo: 'PorAluno',     valor_venda_base: 80,  custo_interno_base: 0, obrigatorio: true },
  { nome: 'Formação de Professores', categoria: 'ItemFixo',   tipo_calculo: 'PorProfessor', valor_venda_base: 500, custo_interno_base: 0, obrigatorio: true },
  { nome: 'Simulados e Avaliações',  categoria: 'Plataforma', tipo_calculo: 'PorAluno',     valor_venda_base: 25,  custo_interno_base: 0, obrigatorio: true },
].map((c, i) => ({ ...c, produto_id: produto.id, ativo: true, ordem: i + 1 }))

const { error } = await sb.from('produto_componentes').insert(componentes)
if (error) { console.log('ERRO:', error.message); process.exit(1) }
console.log('✅ 4 componentes do ENEM inseridos com sucesso')
