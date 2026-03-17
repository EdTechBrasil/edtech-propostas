// Migration de dados: classifica produtos por tipo
// Rodar após DDL: node scripts/run-migration-orcamento.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const updates = [
  { tipo: 'Currículo',               pattern: ['%Meu Primeiro Código%', '%Cria+Code%', '%BNCC%'] },
  { tipo: 'Plataforma',              pattern: ['%Curiosamente%', '%CuriosaMente%', '%Coding%', '%SAEB%'] },
  { tipo: 'IA',                      pattern: ['% IA%', '%MAXIA%', '%Inteligência%'] },
  { tipo: 'Gamificação',             pattern: ['%Seppo%', '%SEPPO%'] },
  { tipo: 'Robótica',                pattern: ['%Arduino%'] },
  { tipo: 'EJA',                     pattern: ['%EJA%'] },
  { tipo: 'ENEM',                    pattern: ['%ENEM%'] },
  { tipo: 'Redação',                 pattern: ['%Redação%', '%Redacao%'] },
  { tipo: 'Pensamento Computacional', pattern: ['%CODMOS%', '%Codmos%'] },
]

let totalUpdated = 0

for (const { tipo, pattern } of updates) {
  for (const p of pattern) {
    const { data, error } = await supabase
      .from('produtos')
      .update({ tipo })
      .ilike('nome', p)
      .is('tipo', null) // só atualiza os que ainda não têm tipo
      .select('id, nome')

    if (error) {
      console.error(`Erro ao atualizar tipo="${tipo}" pattern="${p}":`, error.message)
    } else if (data && data.length > 0) {
      console.log(`✅ tipo="${tipo}" (${p}): ${data.length} produto(s)`)
      data.forEach(d => console.log(`   - ${d.nome}`))
      totalUpdated += data.length
    }
  }
}

console.log(`\nTotal atualizado: ${totalUpdated} produto(s)`)
