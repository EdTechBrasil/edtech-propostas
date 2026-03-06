import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://qtdmtdetepebqcpzcsdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
)

// 1. Deletar SAEB Brasil e SAEB Evoluir
const { data: saebProds } = await sb.from('produtos').select('id,nome').in('nome', ['SAEB Brasil', 'SAEB Evoluir'])
for (const p of saebProds) {
  await sb.from('produto_componentes').delete().eq('produto_id', p.id)
  await sb.from('produto_servicos').delete().eq('produto_id', p.id)
  const { error } = await sb.from('produtos').delete().eq('id', p.id)
  if (error) console.log('Erro ao deletar', p.nome, error.message)
  else console.log('🗑️  Deletado:', p.nome)
}

// 2. Renomear produtos para os nomes corretos do catálogo
const renames = [
  ['Edtech IA',                    'Edtech Brasil – Inteligência Artificial'],
  ['CODMOS',                       'Codmos - Pensamento Computacional'],
  ['Cultura Digital e Programação','Cria+Code - BNCC da Computação'],
  ['Edtech Arduino',               'Edtech Arduino - Programação & Automação'],
  ['ENEM',                         'Enem Brasil'],
  ['EJA',                          'EJA Brasil'],
  ['CuriosaMente',                 'Curiosamente'],
  ['MAXIA',                        'Maxia - Aprendizagem Preditiva'],
  ['SEPPO',                        'Seppo - Gamificação de Conteúdos'],
]

for (const [de, para] of renames) {
  const { error } = await sb.from('produtos').update({ nome: para }).eq('nome', de)
  if (error) console.log('Erro ao renomear', de, error.message)
  else console.log('✏️  Renomeado:', de, '→', para)
}

// 3. Criar "Plataforma de Redação Inteligente"
const { error: createErr } = await sb.from('produtos').insert({
  nome: 'Plataforma de Redação Inteligente',
  descricao: null,
  ativo: true,
})
if (createErr) console.log('Erro ao criar Plataforma de Redação:', createErr.message)
else console.log('✅ Criado: Plataforma de Redação Inteligente')

console.log('\nConcluído!')
