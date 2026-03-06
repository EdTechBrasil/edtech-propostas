/**
 * Insere 3 serviços padrão em todos os produtos que ainda não os possuem.
 * Uso: node scripts/inserir-servicos-todos-cursos.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const SERVICOS = [
  { nome: 'Assessoria Pedagógica',  tipo_calculo: 'Fixo', valor_venda_base: 1119.40, custo_interno_base: 0, obrigatorio: false },
  { nome: 'Formação EAD',           tipo_calculo: 'Fixo', valor_venda_base: 750.00,  custo_interno_base: 0, obrigatorio: false },
  { nome: 'Formação Presencial (4h)', tipo_calculo: 'Fixo', valor_venda_base: 1149.40, custo_interno_base: 0, obrigatorio: true  },
]

;(async () => {
  console.log('🚀 Inserindo serviços padrão em todos os cursos...\n')

  // 1. Buscar todos os produtos
  const { data: produtos, error: errP } = await supabase
    .from('produtos')
    .select('id, nome')
    .order('nome')

  if (errP) { console.error('❌ Falha ao buscar produtos:', errP.message); process.exit(1) }
  console.log(`📦 ${produtos.length} produto(s) encontrado(s)\n`)

  let totalInseridos = 0
  let totalPulados   = 0

  for (const produto of produtos) {
    console.log(`  → ${produto.nome} (${produto.id})`)

    // 2. Buscar serviços já existentes neste produto
    const { data: existentes } = await supabase
      .from('produto_servicos')
      .select('nome')
      .eq('produto_id', produto.id)

    const nomesExistentes = new Set((existentes ?? []).map(s => s.nome))

    for (const srv of SERVICOS) {
      if (nomesExistentes.has(srv.nome)) {
        console.log(`     ⏭  "${srv.nome}" já existe — pulado`)
        totalPulados++
        continue
      }

      const { error: errI } = await supabase
        .from('produto_servicos')
        .insert({ produto_id: produto.id, ativo: true, ...srv })

      if (errI) {
        console.error(`     ❌ Erro ao inserir "${srv.nome}": ${errI.message}`)
      } else {
        console.log(`     ✅ "${srv.nome}" inserido`)
        totalInseridos++
      }
    }
  }

  console.log(`\n✅ Concluído! ${totalInseridos} inserido(s), ${totalPulados} já existia(m).`)
})()
