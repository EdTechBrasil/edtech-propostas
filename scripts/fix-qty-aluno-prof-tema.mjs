import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

console.log('Buscando produto_componentes com tipo_calculo = PorAlunoEProfessorXTema...')
const { data: pcs, error: errPC } = await supabase
  .from('produto_componentes')
  .select('id, nome')
  .eq('tipo_calculo', 'PorAlunoEProfessorXTema')

if (errPC) { console.error('Erro:', errPC.message); process.exit(1) }
if (!pcs.length) { console.log('Nenhum produto_componente encontrado.'); process.exit(0) }

const pcIdSet = new Set(pcs.map(pc => pc.id))
console.log(`  Encontrados: ${pcs.map(p => p.nome).join(', ')}`)

console.log('\nBuscando propostas com num_temas > 0 e (num_alunos + num_professores) > 0...')
const { data: propostas, error: errP } = await supabase
  .from('propostas')
  .select('id, num_alunos, num_professores, num_temas')
  .gt('num_temas', 0)

if (errP) { console.error('Erro:', errP.message); process.exit(1) }

const propostasValidas = (propostas || []).filter(
  p => (p.num_alunos + p.num_professores) > 0
)
console.log(`  Propostas elegíveis: ${propostasValidas.length}`)

let totalAtualizados = 0

for (const proposta of propostasValidas) {
  const novaQtd = (proposta.num_alunos + proposta.num_professores) * proposta.num_temas

  const { data: comps, error: errC } = await supabase
    .from('proposta_componentes')
    .select('id, produto_componente_id, quantidade')
    .eq('proposta_id', proposta.id)

  if (errC) { console.error(`  Erro em proposta ${proposta.id}:`, errC.message); continue }

  const alvo = (comps || []).filter(c => pcIdSet.has(c.produto_componente_id))
  if (!alvo.length) continue

  console.log(`\nProposta ${proposta.id} (alunos=${proposta.num_alunos} prof=${proposta.num_professores} temas=${proposta.num_temas}) → nova qty=${novaQtd}`)

  for (const comp of alvo) {
    if (comp.quantidade === novaQtd) {
      console.log(`  [OK] ${comp.id} já está correto (${comp.quantidade})`)
      continue
    }
    console.log(`  [UPDATE] ${comp.id}: ${comp.quantidade} → ${novaQtd}`)
    const { error: errU } = await supabase
      .from('proposta_componentes')
      .update({ quantidade: novaQtd })
      .eq('id', comp.id)
    if (errU) { console.error('  Erro ao atualizar:', errU.message) }
    else { totalAtualizados++ }
  }
}

console.log(`\nConcluído. Total atualizado: ${totalAtualizados} registro(s).`)
