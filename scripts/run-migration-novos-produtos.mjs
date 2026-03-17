// Insere os 4 novos produtos com serviços, componentes e produto_series.
// Uso: node scripts/run-migration-novos-produtos.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

const SERVICOS_PADRAO = [
  { nome: 'Formação Presencial (4h)', tipo_calculo: 'Fixo',         obrigatorio: true,  custo_interno_base: 0,   ordem: 1 },
  { nome: 'Formação EAD',             tipo_calculo: 'Fixo',         obrigatorio: false, custo_interno_base: 0,   ordem: 2 },
  { nome: 'Assessoria Pedagógica',    tipo_calculo: 'Fixo',         obrigatorio: false, custo_interno_base: 0,   ordem: 3 },
  { nome: 'Honorário do Formador',    tipo_calculo: 'Fixo',         obrigatorio: true,  custo_interno_base: 130, ordem: 4 },
  { nome: 'Hospedagem',               tipo_calculo: 'Fixo',         obrigatorio: false, custo_interno_base: 300, ordem: 5 },
  { nome: 'Alimentação',              tipo_calculo: 'Fixo',         obrigatorio: false, custo_interno_base: 100, ordem: 6 },
  { nome: 'Kit Lanche',               tipo_calculo: 'PorProfessor', obrigatorio: false, custo_interno_base: 15,  ordem: 7 },
  { nome: 'Caneta',                   tipo_calculo: 'PorProfessor', obrigatorio: false, custo_interno_base: 5,   ordem: 8 },
  { nome: 'Bloco de Anotação',        tipo_calculo: 'PorProfessor', obrigatorio: false, custo_interno_base: 5,   ordem: 9 },
  { nome: 'Deslocamento',             tipo_calculo: 'Fixo',         obrigatorio: false, custo_interno_base: 0,   ordem: 10 },
]

const PRODUTOS = [
  {
    nome: 'Robótica Educacional / Cria+Bot',
    descricao: 'Kit de robótica educacional para EF Anos Iniciais/Finais e Ensino Médio.',
    tipo: 'Robótica',
    series: ['ano1','ano2','ano3','ano4','ano5','ano6','ano7','ano8','ano9','em'],
    componentes: [
      { nome: 'Livros do Aluno (EF)',    categoria: 'Livro', tipo_calculo: 'PorAluno',     valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true,  ordem: 1 },
      { nome: 'Livros do Professor (EF)',categoria: 'Livro', tipo_calculo: 'PorProfessor', valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true,  ordem: 2 },
      { nome: 'Coleção Cria+Bot (EM)',   categoria: 'Livro', tipo_calculo: 'PorProfessor', valor_venda_base: 0, custo_interno_base: 0, obrigatorio: false, ordem: 3 },
    ],
  },
  {
    nome: 'Ciclo Aprendiz',
    descricao: 'Temas Contemporâneos Transversais para Anos Iniciais e Finais.',
    tipo: 'Currículo',
    series: ['ano1','ano2','ano3','ano4','ano5','ano6','ano7','ano8','ano9'],
    componentes: [
      { nome: 'Livro do Aluno',    categoria: 'Livro', tipo_calculo: 'PorAluno',     valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 1 },
      { nome: 'Guia do Professor', categoria: 'Livro', tipo_calculo: 'PorProfessor', valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 2 },
    ],
  },
  {
    nome: 'Trilhas do Saber',
    descricao: 'Temas Contemporâneos Transversais para Anos Finais (6º–9º).',
    tipo: 'Currículo',
    series: ['ano6','ano7','ano8','ano9'],
    componentes: [
      { nome: 'Livro do Aluno',                   categoria: 'Livro', tipo_calculo: 'PorAluno',     valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 1 },
      { nome: 'Orientação Didática do Professor', categoria: 'Livro', tipo_calculo: 'PorProfessor', valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 2 },
    ],
  },
  {
    nome: 'Cocri+Ação',
    descricao: 'Competências Socioemocionais para 6º–9º ano.',
    tipo: 'Socioemocional',
    series: ['ano6','ano7','ano8','ano9'],
    componentes: [
      { nome: 'Livro do Aluno',    categoria: 'Livro', tipo_calculo: 'PorAluno',     valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 1 },
      { nome: 'Livro do Professor',categoria: 'Livro', tipo_calculo: 'PorProfessor', valor_venda_base: 0, custo_interno_base: 0, obrigatorio: true, ordem: 2 },
    ],
  },
]

for (const p of PRODUTOS) {
  console.log(`\n📦 Processando: ${p.nome}`)

  // Verifica se já existe
  const { data: existing } = await sb.from('produtos').select('id').eq('nome', p.nome).single()
  if (existing) {
    console.log(`  ⚠️  Produto já existe (id: ${existing.id}) — pulando INSERT de produto`)
    var produtoId = existing.id
  } else {
    // Insere produto
    const { data: novo, error: errProd } = await sb
      .from('produtos')
      .insert({ nome: p.nome, descricao: p.descricao, ativo: true, tipo: p.tipo })
      .select('id')
      .single()
    if (errProd) { console.error(`  ❌ Erro ao inserir produto:`, errProd.message); continue }
    var produtoId = novo.id
    console.log(`  ✅ Produto inserido (id: ${produtoId})`)
  }

  // Serviços
  await sb.from('produto_servicos').delete().eq('produto_id', produtoId)
  const servicos = SERVICOS_PADRAO.map(s => ({ ...s, produto_id: produtoId, ativo: true }))
  const { error: errServ } = await sb.from('produto_servicos').insert(servicos)
  if (errServ) { console.error(`  ❌ Erro ao inserir serviços:`, errServ.message) }
  else { console.log(`  ✅ ${servicos.length} serviços inseridos`) }

  // Componentes
  await sb.from('produto_componentes').delete().eq('produto_id', produtoId)
  const componentes = p.componentes.map(c => ({ ...c, produto_id: produtoId, ativo: true }))
  const { error: errComp } = await sb.from('produto_componentes').insert(componentes)
  if (errComp) { console.error(`  ❌ Erro ao inserir componentes:`, errComp.message) }
  else { console.log(`  ✅ ${componentes.length} componentes inseridos`) }

  // Séries
  await sb.from('produto_series').delete().eq('produto_id', produtoId)
  const series = p.series.map(serie => ({ produto_id: produtoId, serie }))
  const { error: errSeries } = await sb.from('produto_series').insert(series)
  if (errSeries) { console.error(`  ❌ Erro ao inserir séries:`, errSeries.message) }
  else { console.log(`  ✅ Séries: [${p.series.join(', ')}]`) }
}

console.log('\n🎉 Migração concluída.')
