'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notificarGestores } from './notificacoes'
import { TAPETE_TYPES, TAPETE_KEYS, TAPETE_MULT } from '@/lib/constants'

// ── Tipos auxiliares para joins do Supabase ───────────────────────────────────

type CompRow = {
  id: string
  componente: { tipo_calculo: string; categoria: string } | null
}

type ServRow = {
  id: string
  servico: { tipo_calculo: string } | null
}

type CompDuplicar = {
  produto_componente_id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
}

type ServDuplicar = {
  produto_servico_id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
}

// ── Cálculo de quantidade sugerida ────────────────────────────────────────────

function calcQtd(
  tipoCalculo: string,
  numProf: number,
  numAlun: number,
  numEsc: number,
  numTemas: number,
  numKits: number,
): number {
  if (tipoCalculo === 'PorProfessor'           && numProf > 0) return numProf
  if (tipoCalculo === 'PorAluno'               && numAlun > 0) return numAlun
  if (tipoCalculo === 'PorEscola'              && numEsc  > 0) return numEsc
  if (tipoCalculo === 'PorAlunoXTema'          && numAlun > 0 && numTemas > 0) return numAlun * numTemas
  if (tipoCalculo === 'PorProfessorXTema'      && numProf > 0 && numTemas > 0) return numProf * numTemas
  if (tipoCalculo === 'PorAlunoEProfessorXTema' && (numAlun > 0 || numProf > 0) && numTemas > 0) return (numAlun + numProf) * numTemas
  if (tipoCalculo === 'Kit'                    && numEsc  > 0) return numEsc * 5
  if (tipoCalculo === 'PorEscolaXKit'          && numEsc  > 0 && numKits > 0) return numEsc * numKits
  if (TAPETE_TYPES.has(tipoCalculo)) {
    return numKits > 0 ? TAPETE_MULT[tipoCalculo] * numKits : 0
  }
  return 1
}

async function registrarHistorico(
  proposta_id: string,
  usuario_id: string,
  tipo_evento: string,
  detalhes: string
) {
  const supabase = await createClient()
  await supabase.from('proposta_historico').insert({
    proposta_id,
    usuario_id,
    tipo_evento,
    detalhes,
  })
}

// ── Step 1: Criar proposta ────────────────────────────────────────────────────

export async function criarProposta(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orcamento_alvo = Number(formData.get('orcamento_alvo')) || 0

  const { data: config } = await supabase
    .from('configuracao_financeira')
    .select('margem_global_max_percent')
    .eq('ativo', true)
    .single<{ margem_global_max_percent: number }>()

  const margem = config?.margem_global_max_percent ?? 30
  const limite_orcamento_max = orcamento_alvo * (1 + margem / 100)

  const { data: proposta, error } = await supabase
    .from('propostas')
    .insert({
      criado_por_usuario_id: user.id,
      orcamento_alvo,
      limite_orcamento_max,
      status: 'Rascunho',
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !proposta) return { error: 'Erro ao criar proposta' }

  await registrarHistorico(
    proposta.id,
    user.id,
    'Criacao',
    `Orçamento: R$ ${orcamento_alvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  )

  redirect(`/proposta/${proposta.id}/produtos`)
}

// ── Step 2: Público ───────────────────────────────────────────────────────────

export async function atualizarPublico(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const num_escolas     = Number(formData.get('escolas') || 0)
  const num_professores = Number(formData.get('professores') || 0)
  const hasMpc      = formData.get('has_mpc')        === 'true'
  const hasCoding   = formData.get('has_coding')     === 'true'
  const hasEdtechIA = formData.get('has_edtech_ia')  === 'true'
  const hasCriaCode = formData.get('has_criacode')   === 'true'
  const hasSeriesData = hasMpc || hasCoding || hasCriaCode

  // MPC series (pre_i..ano3)
  let alunos_pre_i = 0, alunos_pre_ii = 0, alunos_ano1 = 0, alunos_ano2 = 0, alunos_ano3 = 0
  let temas_pre_i  = 0, temas_pre_ii  = 0, temas_ano1  = 0, temas_ano2  = 0, temas_ano3  = 0
  // Coding series (ano4..ano9; ano3 shared with MPC)
  let alunos_ano4 = 0, alunos_ano5 = 0, alunos_ano6 = 0, alunos_ano7 = 0, alunos_ano8 = 0, alunos_ano9 = 0
  let temas_ano4  = 0, temas_ano5  = 0, temas_ano6  = 0, temas_ano7  = 0, temas_ano8  = 0, temas_ano9  = 0

  if (hasMpc) {
    alunos_pre_i  = Number(formData.get('alunos_pre_i')  || 0)
    alunos_pre_ii = Number(formData.get('alunos_pre_ii') || 0)
    alunos_ano1   = Number(formData.get('alunos_ano1')   || 0)
    alunos_ano2   = Number(formData.get('alunos_ano2')   || 0)
    alunos_ano3   = Number(formData.get('alunos_ano3')   || 0)
    temas_pre_i   = Number(formData.get('temas_pre_i')   || 0)
    temas_pre_ii  = Number(formData.get('temas_pre_ii')  || 0)
    temas_ano1    = Number(formData.get('temas_ano1')    || 0)
    temas_ano2    = Number(formData.get('temas_ano2')    || 0)
    temas_ano3    = Number(formData.get('temas_ano3')    || 0)
  }

  if (hasCoding) {
    // ano3 only from Coding form if MPC is not present (to avoid double-reading)
    if (!hasMpc) {
      alunos_ano3 = Number(formData.get('alunos_ano3') || 0)
      temas_ano3  = Number(formData.get('temas_ano3')  || 0)
    }
    alunos_ano4 = Number(formData.get('alunos_ano4') || 0)
    alunos_ano5 = Number(formData.get('alunos_ano5') || 0)
    alunos_ano6 = Number(formData.get('alunos_ano6') || 0)
    alunos_ano7 = Number(formData.get('alunos_ano7') || 0)
    alunos_ano8 = Number(formData.get('alunos_ano8') || 0)
    alunos_ano9 = Number(formData.get('alunos_ano9') || 0)
    temas_ano4  = Number(formData.get('temas_ano4')  || 0)
    temas_ano5  = Number(formData.get('temas_ano5')  || 0)
    temas_ano6  = Number(formData.get('temas_ano6')  || 0)
    temas_ano7  = Number(formData.get('temas_ano7')  || 0)
    temas_ano8  = Number(formData.get('temas_ano8')  || 0)
    temas_ano9  = Number(formData.get('temas_ano9')  || 0)
  }

  if (hasCriaCode) {
    // ano1-ano3: lê se MPC não os preencheu; ano4-ano5: lê se Coding não os preencheu
    if (!hasMpc) {
      alunos_ano1 = Number(formData.get('alunos_ano1') || 0)
      alunos_ano2 = Number(formData.get('alunos_ano2') || 0)
      alunos_ano3 = Number(formData.get('alunos_ano3') || 0)
      temas_ano1  = Number(formData.get('temas_ano1')  || 0)
      temas_ano2  = Number(formData.get('temas_ano2')  || 0)
      temas_ano3  = Number(formData.get('temas_ano3')  || 0)
    }
    if (!hasCoding) {
      alunos_ano4 = Number(formData.get('alunos_ano4') || 0)
      alunos_ano5 = Number(formData.get('alunos_ano5') || 0)
      temas_ano4  = Number(formData.get('temas_ano4')  || 0)
      temas_ano5  = Number(formData.get('temas_ano5')  || 0)
    }
  }

  // Edtech IA: livros de conceitos (1–4) e práticas (0–2)
  const num_livros_conceitos = hasEdtechIA ? Math.min(4, Math.max(1, Number(formData.get('livros_conceitos') || 1))) : 0
  const num_livros_praticas  = hasEdtechIA ? Math.min(2, Math.max(0, Number(formData.get('livros_praticas')  || 0))) : 0
  // MPC: volumes do Guia do Professor (≥ 1)
  const num_livros_guia = Math.max(1, Number(formData.get('livros_guia') || 1))

  let num_alunos: number, num_temas: number
  if (hasSeriesData) {
    num_alunos = alunos_pre_i + alunos_pre_ii + alunos_ano1 + alunos_ano2 + alunos_ano3
               + alunos_ano4 + alunos_ano5 + alunos_ano6 + alunos_ano7 + alunos_ano8 + alunos_ano9
    num_temas  = Math.max(
      temas_pre_i, temas_pre_ii, temas_ano1, temas_ano2, temas_ano3,
      temas_ano4, temas_ano5, temas_ano6, temas_ano7, temas_ano8, temas_ano9, 0
    )
  } else {
    num_alunos = Number(formData.get('alunos') || 0)
    num_temas  = Number(formData.get('temas') || 0)
  }

  // Pre-computed total for PorAlunoXTema: sum(alunos_série × temas_série) all series
  const totalAlunoXTema =
    alunos_pre_i  * temas_pre_i  + alunos_pre_ii * temas_pre_ii +
    alunos_ano1   * temas_ano1   + alunos_ano2   * temas_ano2   + alunos_ano3 * temas_ano3 +
    alunos_ano4   * temas_ano4   + alunos_ano5   * temas_ano5   + alunos_ano6 * temas_ano6 +
    alunos_ano7   * temas_ano7   + alunos_ano8   * temas_ano8   + alunos_ano9 * temas_ano9

  // series_tapetes: séries com alunos > 0 (para tapetes MPC)
  const seriesList: string[] = []
  if (alunos_pre_i  > 0) seriesList.push('PreI')
  if (alunos_pre_ii > 0) seriesList.push('PreII')
  if (alunos_ano1   > 0) seriesList.push('Ano1')
  if (alunos_ano2   > 0) seriesList.push('Ano2')
  if (alunos_ano3   > 0) seriesList.push('Ano3')
  const series_tapetes = seriesList.join(',')

  const publico_descricao = `Escolas: ${num_escolas} | Alunos: ${num_alunos} | Professores: ${num_professores} | Temas: ${num_temas}`

  // Busca num_kits atual
  const { data: current } = await supabase
    .from('propostas')
    .select('num_kits')
    .eq('id', proposta_id)
    .single<{ num_kits: number }>()
  const num_kits = current?.num_kits ?? 5

  await supabase
    .from('propostas')
    .update({
      publico_descricao, num_escolas, num_alunos, num_professores, num_temas, series_tapetes,
      num_alunos_pre_i: alunos_pre_i, num_alunos_pre_ii: alunos_pre_ii,
      num_alunos_ano1: alunos_ano1, num_alunos_ano2: alunos_ano2, num_alunos_ano3: alunos_ano3,
      num_temas_pre_i: temas_pre_i, num_temas_pre_ii: temas_pre_ii,
      num_temas_ano1: temas_ano1, num_temas_ano2: temas_ano2, num_temas_ano3: temas_ano3,
      num_alunos_ano4: alunos_ano4, num_alunos_ano5: alunos_ano5, num_alunos_ano6: alunos_ano6,
      num_alunos_ano7: alunos_ano7, num_alunos_ano8: alunos_ano8, num_alunos_ano9: alunos_ano9,
      num_temas_ano4: temas_ano4, num_temas_ano5: temas_ano5, num_temas_ano6: temas_ano6,
      num_temas_ano7: temas_ano7, num_temas_ano8: temas_ano8, num_temas_ano9: temas_ano9,
      num_livros_conceitos, num_livros_praticas, num_livros_guia,
    })
    .eq('id', proposta_id)

  // Recalcula quantidades de todos os componentes e serviços da proposta
  const [{ data: compsRaw }, { data: servsRaw }] = await Promise.all([
    supabase
      .from('proposta_componentes')
      .select('id, componente:produto_componentes(tipo_calculo, categoria)')
      .eq('proposta_id', proposta_id),
    supabase
      .from('proposta_servicos')
      .select('id, servico:produto_servicos(tipo_calculo)')
      .eq('proposta_id', proposta_id),
  ])

  const comps = compsRaw as CompRow[] | null
  const servs = servsRaw as ServRow[] | null

  await Promise.all([
    ...(comps ?? [])
      .filter(c => {
        const tc = c.componente?.tipo_calculo
        const cat = c.componente?.categoria
        return tc !== 'Fixo' || cat === 'Kit'
      })
      .map(c => {
        const tc = c.componente?.tipo_calculo ?? 'Fixo'
        const cat = c.componente?.categoria ?? ''
        const qty = TAPETE_TYPES.has(tc)
          ? (seriesList.includes(TAPETE_KEYS[tc]) ? TAPETE_MULT[tc] * num_kits : 0)
          : cat === 'Kit' && tc === 'Fixo'
          ? num_escolas * 5
          : tc === 'PorAlunoXTema'
          ? (hasSeriesData ? totalAlunoXTema : num_alunos * num_temas)
          : tc === 'PorAlunoEProfessorXLivroConceitos'
          ? (num_alunos + num_professores) * num_livros_conceitos
          : tc === 'PorAlunoEProfessorXLivroPraticas'
          ? (num_alunos + num_professores) * num_livros_praticas
          : tc === 'PorProfessorXTema'
          ? num_professores * num_temas * num_livros_guia
          : calcQtd(tc, num_professores, num_alunos, num_escolas, num_temas, num_kits)
        return supabase.from('proposta_componentes')
          .update({ quantidade: qty })
          .eq('id', c.id)
      }),
    ...(servs ?? [])
      .filter(s => s.servico?.tipo_calculo !== 'Fixo')
      .map(s => {
        const tc = s.servico?.tipo_calculo ?? 'Fixo'
        return supabase.from('proposta_servicos')
          .update({ quantidade: calcQtd(tc, num_professores, num_alunos, num_escolas, num_temas, num_kits) })
          .eq('id', s.id)
      }),
  ])

  // Atualiza horas de formação/assessoria (MPC)
  const formacaoUpdates: any[] = []
  const presId = formData.get('formacao_presencial_id') as string | null
  const eadId  = formData.get('formacao_ead_id') as string | null
  const assId  = formData.get('formacao_assessoria_id') as string | null

  const horasPresencial = formData.get('horas_formacao_presencial')
  const horasEAD        = formData.get('horas_formacao_ead')
  const horasAssessoria = formData.get('horas_formacao_assessoria')

  if (presId && horasPresencial !== null && horasPresencial !== '')
    formacaoUpdates.push(supabase.from('proposta_servicos')
      .update({ quantidade: Number(horasPresencial) }).eq('id', presId))
  if (eadId && horasEAD !== null && horasEAD !== '')
    formacaoUpdates.push(supabase.from('proposta_servicos')
      .update({ quantidade: Number(horasEAD) }).eq('id', eadId))
  if (assId && horasAssessoria !== null && horasAssessoria !== '')
    formacaoUpdates.push(supabase.from('proposta_servicos')
      .update({ quantidade: Number(horasAssessoria) }).eq('id', assId))

  if (formacaoUpdates.length > 0) await Promise.all(formacaoUpdates)

  await registrarHistorico(proposta_id, user.id, 'MudancaOrcamento', publico_descricao)

  redirect(`/proposta/${proposta_id}/componentes`)
}

// ── Kits por Escola (configurado no card de Componentes) ─────────────────────

export async function atualizarNumKits(proposta_id: string, num_kits: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: proposta } = await supabase
    .from('propostas')
    .select('num_escolas, series_tapetes, num_temas_pre_i, num_temas_pre_ii, num_temas_ano1, num_temas_ano2, num_temas_ano3')
    .eq('id', proposta_id)
    .single<{
      num_escolas: number
      series_tapetes: string | null
      num_temas_pre_i: number
      num_temas_pre_ii: number
      num_temas_ano1: number
      num_temas_ano2: number
      num_temas_ano3: number
    }>()

  const num_escolas = proposta?.num_escolas ?? 0
  const series_set = new Set((proposta?.series_tapetes ?? '').split(',').filter(Boolean))
  const novaQtd = num_escolas > 0 && num_kits > 0 ? num_escolas * num_kits : 1

  await supabase.from('propostas').update({ num_kits }).eq('id', proposta_id)

  const { data: compsRaw2 } = await supabase
    .from('proposta_componentes')
    .select('id, componente:produto_componentes(tipo_calculo)')
    .eq('proposta_id', proposta_id)

  const comps2 = compsRaw2 as CompRow[] | null

  const updates = (comps2 ?? [])
    .filter(c => {
      const tc = c.componente?.tipo_calculo
      return tc === 'PorEscolaXKit' || (tc != null && TAPETE_TYPES.has(tc) && series_set.has(TAPETE_KEYS[tc]))
    })
    .map(c => {
      const tc = c.componente?.tipo_calculo ?? ''
      const qty = TAPETE_TYPES.has(tc)
        ? calcQtd(tc, 0, 0, num_escolas, 0, num_kits)
        : novaQtd
      return supabase.from('proposta_componentes').update({ quantidade: qty }).eq('id', c.id)
    })

  await Promise.all(updates)
  revalidatePath(`/proposta/${proposta_id}/componentes`)
  return { novaQtd }
}

// ── Step 3: Produtos ──────────────────────────────────────────────────────────

export async function adicionarProduto(proposta_id: string, produto_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verifica se já foi adicionado
  const { data: existe } = await supabase
    .from('proposta_produtos')
    .select('id')
    .eq('proposta_id', proposta_id)
    .eq('produto_id', produto_id)
    .single()

  if (existe) return { error: 'Produto já adicionado' }

  // Busca público da proposta para auto-sugestão de quantidades
  const { data: pubData } = await supabase
    .from('propostas')
    .select(`
      num_professores, num_alunos, num_escolas, num_temas, num_kits, series_tapetes,
      num_alunos_pre_i, num_alunos_pre_ii, num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
      num_temas_pre_i, num_temas_pre_ii, num_temas_ano1, num_temas_ano2, num_temas_ano3,
      num_alunos_ano4, num_alunos_ano5, num_alunos_ano6, num_alunos_ano7, num_alunos_ano8, num_alunos_ano9,
      num_temas_ano4, num_temas_ano5, num_temas_ano6, num_temas_ano7, num_temas_ano8, num_temas_ano9,
      num_livros_conceitos, num_livros_praticas, num_livros_guia
    `)
    .eq('id', proposta_id)
    .single<{
      num_professores: number; num_alunos: number; num_escolas: number
      num_temas: number; num_kits: number; series_tapetes: string | null
      num_alunos_pre_i: number; num_alunos_pre_ii: number
      num_alunos_ano1: number; num_alunos_ano2: number; num_alunos_ano3: number
      num_temas_pre_i: number; num_temas_pre_ii: number
      num_temas_ano1: number; num_temas_ano2: number; num_temas_ano3: number
      num_alunos_ano4: number; num_alunos_ano5: number; num_alunos_ano6: number
      num_alunos_ano7: number; num_alunos_ano8: number; num_alunos_ano9: number
      num_temas_ano4: number; num_temas_ano5: number; num_temas_ano6: number
      num_temas_ano7: number; num_temas_ano8: number; num_temas_ano9: number
      num_livros_conceitos: number; num_livros_praticas: number; num_livros_guia: number
    }>()

  const numProf  = pubData?.num_professores ?? 0
  const numAlun  = pubData?.num_alunos ?? 0
  const numEsc   = pubData?.num_escolas ?? 0
  const numTemas = pubData?.num_temas ?? 0
  const numKits  = pubData?.num_kits ?? 5
  const series_set = new Set((pubData?.series_tapetes ?? '').split(',').filter(Boolean))
  const numLivrosConceitos = pubData?.num_livros_conceitos ?? 1
  const numLivrosPraticas  = pubData?.num_livros_praticas  ?? 0
  const numLivrosGuia      = pubData?.num_livros_guia      ?? 1

  const totalAlunoXTema =
    (pubData?.num_alunos_pre_i  ?? 0) * (pubData?.num_temas_pre_i  ?? 0) +
    (pubData?.num_alunos_pre_ii ?? 0) * (pubData?.num_temas_pre_ii ?? 0) +
    (pubData?.num_alunos_ano1   ?? 0) * (pubData?.num_temas_ano1   ?? 0) +
    (pubData?.num_alunos_ano2   ?? 0) * (pubData?.num_temas_ano2   ?? 0) +
    (pubData?.num_alunos_ano3   ?? 0) * (pubData?.num_temas_ano3   ?? 0) +
    (pubData?.num_alunos_ano4   ?? 0) * (pubData?.num_temas_ano4   ?? 0) +
    (pubData?.num_alunos_ano5   ?? 0) * (pubData?.num_temas_ano5   ?? 0) +
    (pubData?.num_alunos_ano6   ?? 0) * (pubData?.num_temas_ano6   ?? 0) +
    (pubData?.num_alunos_ano7   ?? 0) * (pubData?.num_temas_ano7   ?? 0) +
    (pubData?.num_alunos_ano8   ?? 0) * (pubData?.num_temas_ano8   ?? 0) +
    (pubData?.num_alunos_ano9   ?? 0) * (pubData?.num_temas_ano9   ?? 0)

  const qtdSugerida = (tc: string, nome?: string, categoria?: string) => {
    if (TAPETE_TYPES.has(tc)) {
      if (!series_set.has(TAPETE_KEYS[tc])) return 0
      return calcQtd(tc, 0, 0, numEsc, 0, numKits)
    }
    if (tc === 'Fixo' && categoria === 'Kit') return numEsc * 5
    if (tc === 'Fixo' && nome) {
      const match = nome.match(/\((\d+)h/)
      if (match) return parseInt(match[1])
    }
    if (tc === 'PorAlunoXTema') return totalAlunoXTema > 0 ? totalAlunoXTema : numAlun * numTemas
    if (tc === 'PorProfessorXTema') return numProf * numTemas * numLivrosGuia
    if (tc === 'PorAlunoEProfessorXLivroConceitos') return (numAlun + numProf) * numLivrosConceitos
    if (tc === 'PorAlunoEProfessorXLivroPraticas')  return (numAlun + numProf) * numLivrosPraticas
    return calcQtd(tc, numProf, numAlun, numEsc, numTemas, numKits)
  }

  // Adiciona o produto
  const { data: pp, error } = await supabase
    .from('proposta_produtos')
    .insert({ proposta_id, produto_id })
    .select('id')
    .single<{ id: string }>()

  if (error || !pp) return { error: 'Erro ao adicionar produto' }

  // Adiciona componentes (todos, não apenas obrigatórios)
  const { data: componentes } = await supabase
    .from('produto_componentes')
    .select('*')
    .eq('produto_id', produto_id)
    .eq('ativo', true)

  if (componentes && componentes.length > 0) {
    await supabase.from('proposta_componentes').insert(
      componentes.map((c: any) => ({
        proposta_id,
        proposta_produto_id: pp.id,
        produto_componente_id: c.id,
        quantidade: qtdSugerida(c.tipo_calculo, undefined, c.categoria),
        valor_venda_unit: c.valor_venda_base,
        custo_interno_unit: c.custo_interno_base,
        desconto_percent: 0,
        obrigatorio: c.obrigatorio,
      }))
    )
  }

  // Adiciona serviços (todos, não apenas obrigatórios)
  const { data: servicos } = await supabase
    .from('produto_servicos')
    .select('*')
    .eq('produto_id', produto_id)
    .eq('ativo', true)

  if (servicos && servicos.length > 0) {
    await supabase.from('proposta_servicos').insert(
      servicos.map((s: any) => ({
        proposta_id,
        proposta_produto_id: pp.id,
        produto_servico_id: s.id,
        quantidade: qtdSugerida(s.tipo_calculo, s.nome),
        valor_venda_unit: s.valor_venda_base,
        custo_interno_unit: s.custo_interno_base,
        desconto_percent: 0,
        obrigatorio: s.obrigatorio,
      }))
    )
  }

  await registrarHistorico(proposta_id, user.id, 'AddProduto', `Produto ID: ${produto_id}`)
  revalidatePath(`/proposta/${proposta_id}/produtos`)
  return { success: true, propostaProdutoId: pp.id }
}

export async function removerProduto(proposta_produto_id: string, proposta_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('proposta_produtos')
    .delete()
    .eq('id', proposta_produto_id)

  await registrarHistorico(proposta_id, user.id, 'RemoverProduto', `proposta_produto_id: ${proposta_produto_id}`)
  revalidatePath(`/proposta/${proposta_id}/produtos`)
  return { success: true }
}

// ── Step 4: Componentes ───────────────────────────────────────────────────────

export async function atualizarComponente(
  proposta_componente_id: string,
  proposta_id: string,
  quantidade: number,
  valor_venda_unit: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('proposta_componentes')
    .update({ quantidade, valor_venda_unit })
    .eq('id', proposta_componente_id)

  await registrarHistorico(proposta_id, user.id, 'AlterarComponente', `Qtd: ${quantidade}, Valor: ${valor_venda_unit}`)
  revalidatePath(`/proposta/${proposta_id}/componentes`)
  return { success: true }
}

export async function atualizarServico(
  proposta_servico_id: string,
  proposta_id: string,
  quantidade: number,
  valor_venda_unit: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('proposta_servicos')
    .update({ quantidade, valor_venda_unit })
    .eq('id', proposta_servico_id)

  await registrarHistorico(proposta_id, user.id, 'AlterarServico', `Qtd: ${quantidade}, Valor: ${valor_venda_unit}`)
  revalidatePath(`/proposta/${proposta_id}/componentes`)
  return { success: true }
}

// ── Step 5: Descontos ─────────────────────────────────────────────────────────

const clampPercent = (v: number) => Math.max(0, Math.min(100, v))

export async function atualizarDescontos(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desconto_global = clampPercent(Number(formData.get('desconto_global') || 0))

  await supabase
    .from('propostas')
    .update({ desconto_global_percent: desconto_global })
    .eq('id', proposta_id)

  // Busca produtos e todos os componentes de uma vez (evita N+1)
  const { data: produtos } = await supabase
    .from('proposta_produtos')
    .select('id')
    .eq('proposta_id', proposta_id)

  if (produtos && produtos.length > 0) {
    const produtoIds = produtos.map(pp => pp.id)
    const { data: allComps } = await supabase
      .from('proposta_componentes')
      .select('id, proposta_produto_id')
      .in('proposta_produto_id', produtoIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: PromiseLike<any>[] = []

    for (const pp of produtos) {
      const desconto_produto = clampPercent(Number(formData.get(`desconto_produto_${pp.id}`) || 0))
      updates.push(
        supabase.from('proposta_produtos').update({ desconto_percent: desconto_produto }).eq('id', pp.id)
      )

      const compsForProduct = (allComps ?? []).filter(c => c.proposta_produto_id === pp.id)
      for (const comp of compsForProduct) {
        const desconto_comp = clampPercent(Number(formData.get(`desconto_comp_${comp.id}`) || 0))
        updates.push(
          supabase.from('proposta_componentes').update({ desconto_percent: desconto_comp }).eq('id', comp.id)
        )
      }
    }

    await Promise.all(updates)
  }

  await registrarHistorico(proposta_id, user.id, 'AlterarDesconto', `Desconto global: ${desconto_global}%`)
  redirect(`/proposta/${proposta_id}/repasse`)
}

// ── Step 6: Repasse ───────────────────────────────────────────────────────────

export async function atualizarRepasse(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const repasse_tipo = (formData.get('repasse_tipo') || 'Nenhum') as string
  const repasse_valor = Number(formData.get('repasse_valor') || 0)

  await supabase
    .from('propostas')
    .update({ repasse_tipo, repasse_valor })
    .eq('id', proposta_id)

  await registrarHistorico(proposta_id, user.id, 'AlterarRepasse', `Tipo: ${repasse_tipo}, Valor: ${repasse_valor}`)
  redirect(`/proposta/${proposta_id}/revisao`)
}

// ── Step 7: Solicitar aprovação ───────────────────────────────────────────────

export async function solicitarAprovacao(proposta_id: string, margem_calculada: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: config } = await supabase
    .from('configuracao_financeira')
    .select('margem_minima_percent')
    .eq('ativo', true)
    .single<{ margem_minima_percent: number }>()

  await supabase
    .from('propostas')
    .update({ status: 'Aguardando_aprovacao' })
    .eq('id', proposta_id)

  await supabase.from('aprovacao_excecao_margem').insert({
    proposta_id,
    solicitado_por_usuario_id: user.id,
    margem_minima_percent: config?.margem_minima_percent ?? 12,
    margem_calculada_percent: margem_calculada,
  })

  await registrarHistorico(proposta_id, user.id, 'SolicitarAprovacao', `Margem: ${margem_calculada}%`)
  await notificarGestores(proposta_id, `Proposta precisa de aprovação de margem (${margem_calculada.toFixed(1)}%)`)
  revalidatePath(`/proposta/${proposta_id}/revisao`)
  return { success: true }
}

// ── Step 8: Dados do cliente ──────────────────────────────────────────────────

export async function atualizarDadosCliente(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('propostas')
    .update({
      cliente_nome_instituicao: formData.get('nome_instituicao') as string,
      cliente_cnpj: formData.get('cnpj') as string,
      cliente_responsavel: formData.get('responsavel') as string,
      cliente_email: formData.get('email') as string,
      cliente_cidade: formData.get('cidade') as string,
      validade_proposta: formData.get('validade') as string,
      status: 'Em_revisao',
    })
    .eq('id', proposta_id)

  await registrarHistorico(proposta_id, user.id, 'AtualizarCliente', formData.get('nome_instituicao') as string)
  redirect(`/proposta/${proposta_id}/revisao`)
}

// ── Comentários ───────────────────────────────────────────────────────────────

export async function adicionarComentario(proposta_id: string, texto: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: comentario, error } = await supabase
    .from('proposta_comentarios')
    .insert({ proposta_id, usuario_id: user.id, texto })
    .select('id, texto, criado_em, autor:usuarios!usuario_id(nome)')
    .single<any>()

  if (error || !comentario) return { error: 'Erro ao adicionar comentário' }
  return { comentario }
}

// ── Duplicar proposta ──────────────────────────────────────────────────────────

export async function duplicarProposta(proposta_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: original } = await supabase
    .from('propostas')
    .select(`
      orcamento_alvo, limite_orcamento_max, publico_descricao,
      num_escolas, num_alunos, num_professores, num_temas, num_kits,
      repasse_tipo, repasse_valor, desconto_global_percent, series_tapetes,
      num_alunos_pre_i, num_alunos_pre_ii, num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
      num_temas_pre_i, num_temas_pre_ii, num_temas_ano1, num_temas_ano2, num_temas_ano3,
      num_alunos_ano4, num_alunos_ano5, num_alunos_ano6, num_alunos_ano7, num_alunos_ano8, num_alunos_ano9,
      num_temas_ano4, num_temas_ano5, num_temas_ano6, num_temas_ano7, num_temas_ano8, num_temas_ano9,
      num_livros_conceitos, num_livros_praticas, num_livros_guia
    `)
    .eq('id', proposta_id)
    .single<any>()

  if (!original) return { error: 'Proposta não encontrada' }

  const { data: nova, error } = await supabase
    .from('propostas')
    .insert({
      criado_por_usuario_id: user.id,
      orcamento_alvo: original.orcamento_alvo,
      limite_orcamento_max: original.limite_orcamento_max,
      publico_descricao: original.publico_descricao,
      num_escolas: original.num_escolas,
      num_alunos: original.num_alunos,
      num_professores: original.num_professores,
      num_temas: original.num_temas,
      num_kits: original.num_kits,
      repasse_tipo: original.repasse_tipo,
      repasse_valor: original.repasse_valor,
      desconto_global_percent: original.desconto_global_percent,
      series_tapetes: original.series_tapetes,
      num_alunos_pre_i: original.num_alunos_pre_i,
      num_alunos_pre_ii: original.num_alunos_pre_ii,
      num_alunos_ano1: original.num_alunos_ano1,
      num_alunos_ano2: original.num_alunos_ano2,
      num_alunos_ano3: original.num_alunos_ano3,
      num_temas_pre_i: original.num_temas_pre_i,
      num_temas_pre_ii: original.num_temas_pre_ii,
      num_temas_ano1: original.num_temas_ano1,
      num_temas_ano2: original.num_temas_ano2,
      num_temas_ano3: original.num_temas_ano3,
      num_alunos_ano4: original.num_alunos_ano4,
      num_alunos_ano5: original.num_alunos_ano5,
      num_alunos_ano6: original.num_alunos_ano6,
      num_alunos_ano7: original.num_alunos_ano7,
      num_alunos_ano8: original.num_alunos_ano8,
      num_alunos_ano9: original.num_alunos_ano9,
      num_temas_ano4: original.num_temas_ano4,
      num_temas_ano5: original.num_temas_ano5,
      num_temas_ano6: original.num_temas_ano6,
      num_temas_ano7: original.num_temas_ano7,
      num_temas_ano8: original.num_temas_ano8,
      num_temas_ano9: original.num_temas_ano9,
      num_livros_conceitos: original.num_livros_conceitos,
      num_livros_praticas: original.num_livros_praticas,
      num_livros_guia: original.num_livros_guia,
      status: 'Rascunho',
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !nova) return { error: 'Erro ao duplicar proposta' }

  // Copia produtos com componentes e serviços
  const { data: produtos } = await supabase
    .from('proposta_produtos')
    .select('id, produto_id, desconto_percent')
    .eq('proposta_id', proposta_id)

  if (produtos && produtos.length > 0) {
    await Promise.all(
      produtos.map(async (pp) => {
        const { data: novaPP } = await supabase
          .from('proposta_produtos')
          .insert({ proposta_id: nova.id, produto_id: pp.produto_id, desconto_percent: pp.desconto_percent })
          .select('id')
          .single<{ id: string }>()

        if (!novaPP) return

        const [{ data: compsRaw }, { data: servsRaw }] = await Promise.all([
          supabase
            .from('proposta_componentes')
            .select('produto_componente_id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio')
            .eq('proposta_produto_id', pp.id),
          supabase
            .from('proposta_servicos')
            .select('produto_servico_id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio')
            .eq('proposta_produto_id', pp.id),
        ])

        const comps = compsRaw as CompDuplicar[] | null
        const servs = servsRaw as ServDuplicar[] | null

        await Promise.all([
          comps && comps.length > 0
            ? supabase.from('proposta_componentes').insert(
                comps.map(c => ({
                  proposta_id: nova.id,
                  proposta_produto_id: novaPP.id,
                  produto_componente_id: c.produto_componente_id,
                  quantidade: c.quantidade,
                  valor_venda_unit: c.valor_venda_unit,
                  custo_interno_unit: c.custo_interno_unit,
                  desconto_percent: c.desconto_percent,
                  obrigatorio: c.obrigatorio,
                }))
              )
            : Promise.resolve(),
          servs && servs.length > 0
            ? supabase.from('proposta_servicos').insert(
                servs.map(s => ({
                  proposta_id: nova.id,
                  proposta_produto_id: novaPP.id,
                  produto_servico_id: s.produto_servico_id,
                  quantidade: s.quantidade,
                  valor_venda_unit: s.valor_venda_unit,
                  custo_interno_unit: s.custo_interno_unit,
                  desconto_percent: s.desconto_percent,
                  obrigatorio: s.obrigatorio,
                }))
              )
            : Promise.resolve(),
        ])
      })
    )
  }

  await registrarHistorico(nova.id, user.id, 'Criacao', `Duplicada da proposta #${proposta_id.slice(0, 8)}`)
  revalidatePath('/dashboard')
  return { success: true, novaPropostaId: nova.id }
}

// ── Cancelar proposta ──────────────────────────────────────────────────────────

export async function cancelarProposta(proposta_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: proposta } = await supabase
    .from('propostas')
    .select('criado_por_usuario_id, status')
    .eq('id', proposta_id)
    .single<{ criado_por_usuario_id: string; status: string }>()

  if (!proposta) return { error: 'Proposta não encontrada' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  const podeGestorADM = usuario?.perfil === 'Gestor' || usuario?.perfil === 'ADM'
  const ehCriador = proposta.criado_por_usuario_id === user.id

  if (!podeGestorADM && !ehCriador) return { error: 'Sem permissão' }
  if (proposta.status === 'Pronta_pdf' || proposta.status === 'Cancelada') {
    return { error: 'Não é possível cancelar esta proposta' }
  }

  await supabase
    .from('propostas')
    .update({ status: 'Cancelada' })
    .eq('id', proposta_id)

  await registrarHistorico(proposta_id, user.id, 'Cancelamento', 'Proposta cancelada')
  revalidatePath('/dashboard')
  revalidatePath(`/historico/${proposta_id}`)
  return { success: true }
}

// ── Reordenar produtos da proposta (drag-and-drop) ────────────────────────────

export async function reordenarProdutos(updates: { id: string; ordem: number }[]) {
  const supabase = await createClient()
  // Coluna `ordem` pode não existir ainda (DDL pendente) — ignora silenciosamente
  await Promise.allSettled(
    updates.map(({ id, ordem }) =>
      supabase.from('proposta_produtos').update({ ordem }).eq('id', id)
    )
  )
}

// ── Atualizar prioridade padrão de produto ────────────────────────────────────

export async function atualizarPrioridadePadrao(produto_id: string, prioridade: number) {
  const supabase = await createClient()
  await supabase.from('produtos').update({ prioridade_padrao: prioridade }).eq('id', produto_id)
}

// ── Reordenar catálogo (componentes / serviços) ───────────────────────────────

export async function reordenarCatalogo(
  updates: { id: string; ordem: number }[],
  tipo: 'componentes' | 'servicos'
) {
  const supabase = await createClient()
  const tabela = tipo === 'componentes' ? 'produto_componentes' : 'produto_servicos'
  await Promise.allSettled(
    updates.map(({ id, ordem }) =>
      supabase.from(tabela).update({ ordem }).eq('id', id)
    )
  )
}

// ── Reordenar propostas (drag-and-drop) ───────────────────────────────────────

export async function reordenarPropostas(updates: { id: string; ordem: number }[]) {
  const supabase = await createClient()
  await Promise.all(
    updates.map(({ id, ordem }) =>
      supabase.from('propostas').update({ ordem }).eq('id', id)
    )
  )
  revalidatePath('/dashboard')
}

// ── Wizard: Gerar proposta por orçamento ─────────────────────────────────────

export async function gerarPropostaOrcamento(input: {
  orcamento_alvo: number
  tolerancia_percent: number
  objetivo: string
  num_escolas: number
  num_alunos: number
  num_professores: number
  formacao_presencial_min: number
  formacao_presencial_max: number
  formacao_ead_min: number
  formacao_ead_max: number
  assessoria_min: number
  assessoria_max: number
  produtos_selecionados: Array<{
    produto_id: string
    obrigatorio: boolean
    prioridade: number
  }>
}): Promise<{ propostaId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const {
    orcamento_alvo, tolerancia_percent, objetivo,
    num_escolas, num_alunos, num_professores,
    formacao_presencial_min, formacao_presencial_max,
    formacao_ead_min, formacao_ead_max,
    assessoria_min, assessoria_max,
    produtos_selecionados,
  } = input

  const limite_orcamento_max = orcamento_alvo * (1 + tolerancia_percent / 100)

  // 1. Criar proposta com dados de público já preenchidos
  const { data: proposta, error } = await supabase
    .from('propostas')
    .insert({
      criado_por_usuario_id: user.id,
      orcamento_alvo,
      limite_orcamento_max,
      status: 'Rascunho',
      num_escolas,
      num_alunos,
      num_professores,
      num_temas: 1,
      num_kits: 5,
      tolerancia_percent,
      objetivo,
      publico_descricao: `Escolas: ${num_escolas} | Alunos: ${num_alunos} | Professores: ${num_professores}`,
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !proposta) return { error: `Erro ao criar proposta: ${error?.message ?? 'desconhecido'}` }

  // 2. Adicionar produtos em ordem de prioridade (5 → 1)
  const ordenados = [...produtos_selecionados].sort((a, b) => b.prioridade - a.prioridade)

  for (const p of ordenados) {
    const result = await adicionarProduto(proposta.id, p.produto_id)

    if (p.obrigatorio && result && 'propostaProdutoId' in result) {
      await Promise.all([
        supabase
          .from('proposta_componentes')
          .update({ obrigatorio: true })
          .eq('proposta_produto_id', result.propostaProdutoId),
        supabase
          .from('proposta_servicos')
          .update({ obrigatorio: true })
          .eq('proposta_produto_id', result.propostaProdutoId),
      ])
    }
  }

  // 3. Ajustar horas de formação/assessoria dentro dos limites min/max
  if (
    formacao_presencial_min > 0 || formacao_presencial_max < Infinity ||
    formacao_ead_min > 0 || formacao_ead_max < Infinity ||
    assessoria_min > 0 || assessoria_max < Infinity
  ) {
    const { data: servicos } = await supabase
      .from('proposta_servicos')
      .select('id, quantidade, servico:produto_servicos(nome)')
      .eq('proposta_id', proposta.id)

    if (servicos) {
      const limiteUpdates = servicos
        .map(s => {
          const nome = ((s.servico as { nome?: string } | null)?.nome ?? '').toLowerCase()
          let min = 0, max = Infinity

          if (nome.includes('presencial')) {
            min = formacao_presencial_min
            max = formacao_presencial_max
          } else if (nome.includes('ead') || nome.includes('online') || nome.includes('à distância')) {
            min = formacao_ead_min
            max = formacao_ead_max
          } else if (nome.includes('assessoria') || nome.includes('acompanhamento')) {
            min = assessoria_min
            max = assessoria_max
          } else {
            return null
          }

          const clamped = Math.min(max === Infinity ? s.quantidade : max, Math.max(min, s.quantidade))
          if (clamped === s.quantidade) return null

          return supabase
            .from('proposta_servicos')
            .update({ quantidade: clamped })
            .eq('id', s.id)
        })
        .filter(Boolean)

      if (limiteUpdates.length > 0) await Promise.all(limiteUpdates)
    }
  }

  // 4. Histórico
  await registrarHistorico(
    proposta.id,
    user.id,
    'Criacao',
    `Geração automática por orçamento | R$ ${orcamento_alvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Tolerância: ${tolerancia_percent}% | Objetivo: ${objetivo}`,
  )

  return { propostaId: proposta.id }
}

// ── Gerar PDF: salva dados + muda status + redireciona ─────────────────────────

export async function gerarPDFProposta(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('propostas')
    .update({
      cliente_nome_instituicao: formData.get('nome_instituicao') as string,
      cliente_cnpj: formData.get('cnpj') as string,
      cliente_responsavel: formData.get('responsavel') as string,
      cliente_email: formData.get('email') as string,
      cliente_cidade: formData.get('cidade') as string,
      validade_proposta: formData.get('validade') as string,
      status: 'Pronta_pdf',
    })
    .eq('id', proposta_id)

  await registrarHistorico(proposta_id, user.id, 'GerarPDF', 'PDF gerado')
  redirect(`/proposta/${proposta_id}/pdf`)
}
