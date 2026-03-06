// scripts/run-migration-014.mjs
// Roda BATCH 2 (DML) da migration 014: componentes e valores do Coding
// Executar APÓS rodar o BATCH 1 (DDL) no SQL Editor

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function run() {
  // Busca o produto Coding
  const { data: coding } = await supabase
    .from('produtos')
    .select('id, nome')
    .ilike('nome', '%Coding%')
    .single()

  if (!coding) {
    console.error('Produto "Coding" não encontrado!')
    process.exit(1)
  }
  console.log('Produto Coding encontrado:', coding.id)

  // Adiciona componentes (idempotente)
  const componentes = [
    { nome: 'Livros dos Alunos',   categoria: 'Livro',     tipo_calculo: 'PorAlunoXTema', obrigatorio: true  },
    { nome: 'Livros do Professor', categoria: 'Livro',     tipo_calculo: 'PorProfessor',  obrigatorio: true  },
    { nome: 'Licença da Plataforma', categoria: 'Plataforma', tipo_calculo: 'PorProfessor', obrigatorio: false },
  ]

  for (const comp of componentes) {
    const { data: exists } = await supabase
      .from('produto_componentes')
      .select('id')
      .eq('produto_id', coding.id)
      .eq('nome', comp.nome)
      .single()

    if (exists) {
      console.log(`  Componente já existe: ${comp.nome}`)
      continue
    }

    const { error } = await supabase.from('produto_componentes').insert({
      produto_id: coding.id,
      nome: comp.nome,
      categoria: comp.categoria,
      tipo_calculo: comp.tipo_calculo,
      obrigatorio: comp.obrigatorio,
      valor_venda_base: 0,
      custo_interno_base: 0,
      ativo: true,
    })
    if (error) console.error(`  Erro ao inserir ${comp.nome}:`, error.message)
    else console.log(`  Inserido: ${comp.nome}`)
  }

  // Atualiza valores dos serviços de formação
  const servicoUpdates = [
    { pattern: 'presencial', valor: 1149.40 },
    { pattern: 'ead',        valor: 750.00  },
    { pattern: 'assessoria', valor: 1119.40 },
  ]

  const { data: servicos } = await supabase
    .from('produto_servicos')
    .select('id, nome, valor_venda_base')
    .eq('produto_id', coding.id)

  console.log('\nServiços do Coding:')
  for (const s of servicos ?? []) {
    const match = servicoUpdates.find(u => s.nome.toLowerCase().includes(u.pattern))
    if (match) {
      const { error } = await supabase
        .from('produto_servicos')
        .update({ valor_venda_base: match.valor })
        .eq('id', s.id)
      if (error) console.error(`  Erro ao atualizar ${s.nome}:`, error.message)
      else console.log(`  ${s.nome}: R$ ${match.valor}`)
    } else {
      console.log(`  ${s.nome}: sem alteração`)
    }
  }

  console.log('\nMigration 014 (DML) concluída.')
}

run().catch(console.error)
