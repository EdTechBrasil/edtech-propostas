import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicoCliente } from './publico-cliente'

export default async function PublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: prods }, { data: allServicos }] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, orcamento_alvo, limite_orcamento_max,
        num_escolas, num_professores, num_alunos, num_temas,
        num_alunos_pre_i, num_alunos_pre_ii,
        num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
        num_temas_pre_i, num_temas_pre_ii,
        num_temas_ano1, num_temas_ano2, num_temas_ano3,
        num_alunos_ano4, num_alunos_ano5, num_alunos_ano6,
        num_alunos_ano7, num_alunos_ano8, num_alunos_ano9,
        num_temas_ano4, num_temas_ano5, num_temas_ano6,
        num_temas_ano7, num_temas_ano8, num_temas_ano9,
        num_livros_conceitos, num_livros_praticas, num_livros_guia,
        num_alunos_edtech_ia
      `)
      .eq('id', id)
      .single<{
        id: string
        orcamento_alvo: number
        limite_orcamento_max: number
        num_escolas: number
        num_professores: number
        num_alunos: number
        num_temas: number
        num_alunos_pre_i: number
        num_alunos_pre_ii: number
        num_alunos_ano1: number
        num_alunos_ano2: number
        num_alunos_ano3: number
        num_temas_pre_i: number
        num_temas_pre_ii: number
        num_temas_ano1: number
        num_temas_ano2: number
        num_temas_ano3: number
        num_alunos_ano4: number
        num_alunos_ano5: number
        num_alunos_ano6: number
        num_alunos_ano7: number
        num_alunos_ano8: number
        num_alunos_ano9: number
        num_temas_ano4: number
        num_temas_ano5: number
        num_temas_ano6: number
        num_temas_ano7: number
        num_temas_ano8: number
        num_temas_ano9: number
        num_livros_conceitos: number
        num_livros_praticas: number
        num_livros_guia: number
        num_alunos_edtech_ia: number
      }>(),
    supabase
      .from('proposta_produtos')
      .select('id, num_escolas, num_alunos, produto:produtos(nome), componentes:proposta_componentes(componente:produto_componentes(tipo_calculo))')
      .eq('proposta_id', id),
    supabase
      .from('proposta_servicos')
      .select('id, quantidade, valor_venda_unit, servico:produto_servicos(nome)')
      .eq('proposta_id', id),
  ])

  if (!proposta) notFound()

  const temMPC          = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Primeiro'))
  const temCoding       = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Coding'))
  const temEdtechIA     = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Inteligência Artificial'))
  const temCriaCode     = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Cria+Code'))
  const temCodigoIA     = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('O Código IA'))
  const temCuriosamente = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Curiosamente'))

  const SERIES_PRODUCT_NAMES = ['Primeiro', 'Coding', 'Cria+Code', 'Inteligência Artificial', 'O Código IA', 'Curiosamente']
  const mpcProd      = (prods ?? []).find(p => (p.produto as any)?.nome?.includes('Primeiro'))
  const criaCodeProd = (prods ?? []).find(p => (p.produto as any)?.nome?.includes('Cria+Code') || (p.produto as any)?.nome?.includes('O Código IA'))
  const flatProds = (prods ?? [])
    .filter(p => {
      const nome: string = (p.produto as any)?.nome ?? ''
      return !SERIES_PRODUCT_NAMES.some(n => nome.includes(n))
    })
    .map(p => {
      const comps: any[] = (p as any).componentes ?? []
      const tipoCalcs: string[] = comps.map((c: any) => c.componente?.tipo_calculo ?? '')
      const isPorAluno = tipoCalcs.some(tc => tc === 'PorAluno' || tc === 'PorProfessor')
      const isPorEscola = tipoCalcs.some(tc => tc === 'PorEscola' || tc === 'PorEscolaXKit')
      const tipoPublico: 'PorAluno' | 'PorEscola' = (!isPorEscola && isPorAluno) ? 'PorAluno' : 'PorEscola'
      return {
        pp_id: (p as any).id,
        nome: (p.produto as any)?.nome ?? '',
        num_escolas: (p as any).num_escolas ?? 0,
        num_alunos: (p as any).num_alunos ?? 0,
        tipoPublico,
      }
    })

  // Curiosamente: busca componentes com nome e quantidade para pré-popular G1–G5
  const curiosamenteProd = (prods ?? []).find(p => (p.produto as any)?.nome?.includes('Curiosamente'))
  let curiosamentePp: { ppId: string; grupos: { num: number; alunosCompId: string | null; profCompId: string | null; alunosQty: number; profQty: number }[] } | null = null
  if (curiosamenteProd) {
    const { data: ccComps } = await supabase
      .from('proposta_componentes')
      .select('id, quantidade, componente:produto_componentes(nome)')
      .eq('proposta_produto_id', (curiosamenteProd as any).id)
    const grupos = [1, 2, 3, 4, 5].map(num => {
      const alunosComp = (ccComps ?? []).find(c => (c.componente as any)?.nome?.includes(`Aluno G${num}`))
      const profComp   = (ccComps ?? []).find(c => (c.componente as any)?.nome?.includes(`Prof G${num}`))
      return {
        num,
        alunosCompId: (alunosComp as any)?.id ?? null,
        profCompId:   (profComp as any)?.id   ?? null,
        alunosQty:    (alunosComp as any)?.quantidade ?? 0,
        profQty:      (profComp as any)?.quantidade   ?? 0,
      }
    }).filter(g => g.alunosCompId || g.profCompId)
    curiosamentePp = { ppId: (curiosamenteProd as any).id, grupos }
  }

  const servicoPresencial = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('presencial')) ?? null
  const servicoEAD = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('ead')) ?? null
  const servicoAssessoria = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('assessoria')) ?? null

  const servicosFormacao = {
    presencial: servicoPresencial ? { id: servicoPresencial.id, quantidade: servicoPresencial.quantidade, valor_venda_unit: servicoPresencial.valor_venda_unit } : null,
    ead: servicoEAD ? { id: servicoEAD.id, quantidade: servicoEAD.quantidade, valor_venda_unit: servicoEAD.valor_venda_unit } : null,
    assessoria: servicoAssessoria ? { id: servicoAssessoria.id, quantidade: servicoAssessoria.quantidade, valor_venda_unit: servicoAssessoria.valor_venda_unit } : null,
  }

  return (
    <PublicoCliente
      proposta={proposta}
      temMPC={temMPC}
      temCoding={temCoding}
      temEdtechIA={temEdtechIA}
      temCriaCode={temCriaCode || temCodigoIA}
      temCuriosamente={temCuriosamente}
      servicosFormacao={servicosFormacao}
      mpcPpId={(mpcProd as any)?.id}
      mpcNumEscolas={(mpcProd as any)?.num_escolas ?? 0}
      criaCodePpId={(criaCodeProd as any)?.id}
      criaCodeNumAlunos={(criaCodeProd as any)?.num_alunos ?? 0}
      flatProds={flatProds}
      curiosamentePp={curiosamentePp}
    />
  )
}
