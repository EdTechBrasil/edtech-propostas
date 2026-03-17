// Popula a tabela produto_series com as séries atendidas por cada produto.
// Rodar após criar a tabela no SQL Editor:
//   CREATE TABLE IF NOT EXISTS produto_series (
//     produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
//     serie text NOT NULL,
//     PRIMARY KEY (produto_id, serie)
//   );
//
// Uso: node scripts/run-migration-produto-series.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) { console.error('Forneça SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// série → chave usada no banco
const SERIES_MAP = {
  'Meu Primeiro Código':                          ['pre_i', 'pre_ii', 'ano1', 'ano2', 'ano3'],
  'Cria+Code - BNCC da Computação':               ['ano1', 'ano2', 'ano3', 'ano4', 'ano5'],
  'Edtech Coding - Programação em Blocos':        ['ano3', 'ano4', 'ano5', 'ano6', 'ano7', 'ano8', 'ano9'],
  'Edtech Brasil – Inteligência Artificial':      ['ano6', 'ano7', 'ano8', 'ano9', 'em'],
  'Edtech Arduino - Programação & Automação':     ['ano6', 'ano7', 'ano8', 'ano9', 'em'],
  'Codmos - Pensamento Computacional':            ['ano1', 'ano2', 'ano3', 'ano4', 'ano5', 'ano6', 'ano7', 'ano8', 'ano9'],
  'Seppo - Gamificação de Conteúdos':             ['ano1', 'ano2', 'ano3', 'ano4', 'ano5', 'ano6', 'ano7', 'ano8', 'ano9', 'em'],
  'CuriosAmente':                                 ['creche', 'pre_i', 'pre_ii'],
  'Maxia - Aprendizagem Preditiva':               ['ano1', 'ano2', 'ano3', 'ano4', 'ano5', 'ano6', 'ano7', 'ano8', 'ano9', 'em'],
  'O Código IA':                                  ['ano1', 'ano2', 'ano3', 'ano4', 'ano5'],
  'Plataforma de Redação Inteligente':            ['ano9', 'em'],
  'Enem Brasil':                                  ['em'],
  'EJA Brasil':                                   ['eja'],
}

const { data: produtos, error } = await supabase.from('produtos').select('id, nome')
if (error) { console.error('Erro ao buscar produtos:', error.message); process.exit(1) }

let totalInseridos = 0

for (const produto of produtos) {
  const series = SERIES_MAP[produto.nome]
  if (!series) {
    console.log(`  ⚠️  Sem mapeamento para: ${produto.nome}`)
    continue
  }

  // limpa entradas antigas para este produto
  await supabase.from('produto_series').delete().eq('produto_id', produto.id)

  const rows = series.map(serie => ({ produto_id: produto.id, serie }))
  const { error: err } = await supabase.from('produto_series').insert(rows)
  if (err) {
    console.error(`  ❌ Erro ao inserir ${produto.nome}:`, err.message)
  } else {
    console.log(`  ✅ ${produto.nome} → [${series.join(', ')}]`)
    totalInseridos += series.length
  }
}

console.log(`\n🎉 ${totalInseridos} entradas inseridas na produto_series.`)
