'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notificarGestores } from './notificacoes'

// ── Cálculo de quantidade sugerida ────────────────────────────────────────────

const TAPETE_TYPES = new Set(['TapetePreI', 'TapetePreII', 'Tapete1a3'])
const TAPETE_KEYS: Record<string, string> = { TapetePreI: 'PreI', TapetePreII: 'PreII', Tapete1a3: '1a3' }
const TAPETE_MULT: Record<string, number> = { TapetePreI: 9, TapetePreII: 12, Tapete1a3: 16 }

function calcQtd(
  tipoCalculo: string,
  numProf: number,
  numAlun: number,
  numEsc: number,
  numTemas: number,
  numKits: number
): number {
  if (tipoCalculo === 'PorProfessor'           && numProf > 0) return numProf
  if (tipoCalculo === 'PorAluno'               && numAlun > 0) return numAlun
  if (tipoCalculo === 'PorEscola'              && numEsc  > 0) return numEsc
  if (tipoCalculo === 'PorAlunoXTema'          && numAlun > 0 && numTemas > 0) return numAlun * numTemas
  if (tipoCalculo === 'PorProfessorXTema'      && numProf > 0 && numTemas > 0) return numProf * numTemas
  if (tipoCalculo === 'PorAlunoEProfessorXTema' && (numAlun > 0 || numProf > 0) && numTemas > 0) return (numAlun + numProf) * numTemas
  if (tipoCalculo === 'PorEscolaXKit'          && numEsc  > 0 && numKits > 0) return numEsc * numKits
  if (TAPETE_TYPES.has(tipoCalculo) && numTemas > 0 && numKits > 0)
    return TAPETE_MULT[tipoCalculo] * numTemas * numKits
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

  redirect(`/proposta/${proposta.id}/publico`)
}

// ── Step 2: Público ───────────────────────────────────────────────────────────

export async function atualizarPublico(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const num_escolas = Number(formData.get('escolas') || 0)
  const num_alunos = Number(formData.get('alunos') || 0)
  const num_professores = Number(formData.get('professores') || 0)
  const num_temas = Number(formData.get('temas') || 0)
  const distribuicao = formData.get('distribuicao') || ''

  const publico_descricao = distribuicao
    ? `Distribuição por série: ${distribuicao}`
    : `Escolas: ${num_escolas} | Alunos: ${num_alunos} | Professores: ${num_professores} | Temas: ${num_temas}`

  // Busca num_kits e series_tapetes atuais (não editados no Público)
  const { data: current } = await supabase
    .from('propostas')
    .select('num_kits, series_tapetes')
    .eq('id', proposta_id)
    .single<{ num_kits: number; series_tapetes: string | null }>()
  const num_kits = current?.num_kits ?? 5
  const series_set = new Set((current?.series_tapetes ?? '').split(',').filter(Boolean))

  await supabase
    .from('propostas')
    .update({ publico_descricao, num_escolas, num_alunos, num_professores, num_temas })
    .eq('id', proposta_id)

  // Recalcula quantidades de todos os componentes e serviços da proposta
  const [{ data: comps }, { data: servs }] = await Promise.all([
    supabase
      .from('proposta_componentes')
      .select('id, componente:produto_componentes(tipo_calculo)')
      .eq('proposta_id', proposta_id),
    supabase
      .from('proposta_servicos')
      .select('id, servico:produto_servicos(tipo_calculo)')
      .eq('proposta_id', proposta_id),
  ])

  await Promise.all([
    ...(comps ?? [])
      .filter(c => (c.componente as any)?.tipo_calculo !== 'Fixo')
      .map(c => {
        const tc = (c.componente as any)?.tipo_calculo ?? 'Fixo'
        const qty = TAPETE_TYPES.has(tc) && !series_set.has(TAPETE_KEYS[tc])
          ? 0
          : calcQtd(tc, num_professores, num_alunos, num_escolas, num_temas, num_kits)
        return supabase.from('proposta_componentes')
          .update({ quantidade: qty })
          .eq('id', c.id)
      }),
    ...(servs ?? [])
      .filter(s => (s.servico as any)?.tipo_calculo !== 'Fixo')
      .map(s => {
        const tc = (s.servico as any)?.tipo_calculo ?? 'Fixo'
        return supabase.from('proposta_servicos')
          .update({ quantidade: calcQtd(tc, num_professores, num_alunos, num_escolas, num_temas, num_kits) })
          .eq('id', s.id)
      }),
  ])

  await registrarHistorico(proposta_id, user.id, 'MudancaOrcamento', publico_descricao)

  redirect(`/proposta/${proposta_id}/produtos`)
}

// ── Kits por Escola (configurado no card de Componentes) ─────────────────────

export async function atualizarNumKits(proposta_id: string, num_kits: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: proposta } = await supabase
    .from('propostas')
    .select('num_escolas, num_temas, series_tapetes')
    .eq('id', proposta_id)
    .single<{ num_escolas: number; num_temas: number; series_tapetes: string | null }>()

  const num_escolas = proposta?.num_escolas ?? 0
  const num_temas = proposta?.num_temas ?? 0
  const series_set = new Set((proposta?.series_tapetes ?? '').split(',').filter(Boolean))
  const novaQtd = num_escolas > 0 && num_kits > 0 ? num_escolas * num_kits : 1

  await supabase.from('propostas').update({ num_kits }).eq('id', proposta_id)

  const { data: comps } = await supabase
    .from('proposta_componentes')
    .select('id, componente:produto_componentes(tipo_calculo)')
    .eq('proposta_id', proposta_id)

  const updates = (comps ?? [])
    .filter(c => {
      const tc = (c.componente as any)?.tipo_calculo
      return tc === 'PorEscolaXKit' || (TAPETE_TYPES.has(tc) && series_set.has(TAPETE_KEYS[tc]))
    })
    .map(c => {
      const tc = (c.componente as any)?.tipo_calculo
      const qty = TAPETE_TYPES.has(tc)
        ? calcQtd(tc, 0, 0, num_escolas, num_temas, num_kits)
        : novaQtd
      return supabase.from('proposta_componentes').update({ quantidade: qty }).eq('id', c.id)
    })

  await Promise.all(updates)
  revalidatePath(`/proposta/${proposta_id}/componentes`)
  return { novaQtd }
}

// ── Séries de Tapetes (configurado no card de Componentes) ───────────────────

export async function atualizarSeriesTapetes(proposta_id: string, series: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const seriesTapetes = series.join(',')

  const { data: proposta } = await supabase
    .from('propostas')
    .select('num_professores, num_alunos, num_escolas, num_temas, num_kits')
    .eq('id', proposta_id)
    .single<{ num_professores: number; num_alunos: number; num_escolas: number; num_temas: number; num_kits: number }>()

  await supabase.from('propostas').update({ series_tapetes: seriesTapetes }).eq('id', proposta_id)

  const numProf  = proposta?.num_professores ?? 0
  const numAlun  = proposta?.num_alunos ?? 0
  const numEsc   = proposta?.num_escolas ?? 0
  const numTemas = proposta?.num_temas ?? 0
  const numKits  = proposta?.num_kits ?? 5

  const { data: comps } = await supabase
    .from('proposta_componentes')
    .select('id, componente:produto_componentes(tipo_calculo)')
    .eq('proposta_id', proposta_id)

  const tapetes = (comps ?? []).filter(c => TAPETE_TYPES.has((c.componente as any)?.tipo_calculo))

  if (tapetes.length > 0) {
    await Promise.all(
      tapetes.map(c => {
        const tc = (c.componente as any)?.tipo_calculo
        const enabled = series.includes(TAPETE_KEYS[tc])
        const qty = enabled ? calcQtd(tc, numProf, numAlun, numEsc, numTemas, numKits) : 0
        return supabase.from('proposta_componentes').update({ quantidade: qty }).eq('id', c.id)
      })
    )
  }

  revalidatePath(`/proposta/${proposta_id}/componentes`)
  return { success: true, seriesTapetes }
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
    .select('num_professores, num_alunos, num_escolas, num_temas, num_kits')
    .eq('id', proposta_id)
    .single<{ num_professores: number; num_alunos: number; num_escolas: number; num_temas: number; num_kits: number }>()

  const numProf = pubData?.num_professores ?? 0
  const numAlun = pubData?.num_alunos ?? 0
  const numEsc  = pubData?.num_escolas ?? 0
  const numTemas = pubData?.num_temas ?? 0
  const numKits = pubData?.num_kits ?? 5

  const qtdSugerida = (tc: string) => TAPETE_TYPES.has(tc) ? 0 : calcQtd(tc, numProf, numAlun, numEsc, numTemas, numKits)

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
        quantidade: qtdSugerida(c.tipo_calculo),
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
        quantidade: qtdSugerida(s.tipo_calculo),
        valor_venda_unit: s.valor_venda_base,
        custo_interno_unit: s.custo_interno_base,
        desconto_percent: 0,
        obrigatorio: s.obrigatorio,
      }))
    )
  }

  await registrarHistorico(proposta_id, user.id, 'AddProduto', `Produto ID: ${produto_id}`)
  revalidatePath(`/proposta/${proposta_id}/produtos`)
  return { success: true }
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

export async function atualizarDescontos(proposta_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desconto_global = Number(formData.get('desconto_global') || 0)

  await supabase
    .from('propostas')
    .update({ desconto_global_percent: desconto_global })
    .eq('id', proposta_id)

  // Atualiza desconto por produto
  const { data: produtos } = await supabase
    .from('proposta_produtos')
    .select('id')
    .eq('proposta_id', proposta_id)

  if (produtos) {
    for (const pp of produtos) {
      const desconto_produto = Number(formData.get(`desconto_produto_${pp.id}`) || 0)
      await supabase
        .from('proposta_produtos')
        .update({ desconto_percent: desconto_produto })
        .eq('id', pp.id)

      // Atualiza desconto por componente
      const { data: comps } = await supabase
        .from('proposta_componentes')
        .select('id')
        .eq('proposta_produto_id', pp.id)

      if (comps) {
        for (const comp of comps) {
          const desconto_comp = Number(formData.get(`desconto_comp_${comp.id}`) || 0)
          await supabase
            .from('proposta_componentes')
            .update({ desconto_percent: desconto_comp })
            .eq('id', comp.id)
        }
      }
    }
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
    .select('orcamento_alvo, limite_orcamento_max, publico_descricao, num_escolas, num_alunos, num_professores, num_temas, num_kits, repasse_tipo, repasse_valor, desconto_global_percent')
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
    for (const pp of produtos) {
      const { data: novaPP } = await supabase
        .from('proposta_produtos')
        .insert({ proposta_id: nova.id, produto_id: pp.produto_id, desconto_percent: pp.desconto_percent })
        .select('id')
        .single<{ id: string }>()

      if (!novaPP) continue

      const [{ data: comps }, { data: servs }] = await Promise.all([
        supabase
          .from('proposta_componentes')
          .select('produto_componente_id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio')
          .eq('proposta_produto_id', pp.id),
        supabase
          .from('proposta_servicos')
          .select('produto_servico_id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio')
          .eq('proposta_produto_id', pp.id),
      ])

      if (comps && comps.length > 0) {
        await supabase.from('proposta_componentes').insert(
          comps.map((c: any) => ({
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
      }

      if (servs && servs.length > 0) {
        await supabase.from('proposta_servicos').insert(
          servs.map((s: any) => ({
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
      }
    }
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
