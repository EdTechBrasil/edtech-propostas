import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.argv[2] ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('Forneça a service role key como argumento ou env SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

console.log('Migration 018: Kit de Software/Hardware IA → PorEscolaXKit...')

const { data, error } = await supabase
  .from('produto_componentes')
  .update({ tipo_calculo: 'PorEscolaXKit' })
  .eq('nome', 'Kit de Software/Hardware IA')
  .eq('tipo_calculo', 'Fixo')
  .eq('categoria', 'Kit')
  .select('id, nome, tipo_calculo')

if (error) { console.error('❌', error.message); process.exit(1) }

if (!data || data.length === 0) {
  console.log('ℹ️  Nenhum registro atualizado (já correto ou não encontrado)')
} else {
  console.log(`✅ ${data.length} componente(s) atualizados:`)
  data.forEach(c => console.log(`   - ${c.nome} → ${c.tipo_calculo}`))
}
