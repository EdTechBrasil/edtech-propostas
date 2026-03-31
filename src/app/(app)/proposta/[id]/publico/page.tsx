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

  const temMPC      = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Primeiro'))
  const temCoding   = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Coding'))
  const temEdtechIA = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Inteligência Artificial'))
  const temCriaCode = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Cria+Code'))
  const temCodigoIA = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('O Código IA'))

  // Produtos com séries fixas — excluídos da detecção automática
  const SERIES_NAMES_LOWER = ['primeiro', 'coding', 'cria+code', 'inteligência artificial', 'o código ia']

  const mpcProd      = (prods ?? []).find(p => (p.produto as any)?.nome?.includes('Primeiro'))
  const criaCodeProd = (prods ?? []).find(p => (p.produto as any)?.nome?.includes('Cria+Code') || (p.produto as any)?.nome?.includes('O Código IA'))

  // Produtos restantes — detectar automaticamente se são per-group ou flat
  const remainingProds = (prods ?? []).filter(p => {
    const nome = ((p.produto as any)?.nome ?? '').toLowerCase()
    return !SERIES_NAMES_LOWER.some(n => nome.includes(n))
  })

  // Buscar componentes de todos os produtos restantes de uma vez
  const remainingIds = remainingProds.map(p => (p as any).id)
  const { data: remainingComps } = remainingIds.length > 0
    ? await supabase
        .from('proposta_componentes')
        .select('id, quantidade, proposta_produto_id, componente:produto_componentes(nome)')
        .in('proposta_produto_id', remainingIds)
    : { data: [] }

  type PerGroupGrupo = { num: number; label: string; alunosCompId: string | null; profCompId: string | null; alunosQty: number; profQty: number }
  type PerGroupProd = { ppId: string; nome: string; grupos: PerGroupGrupo[] }

  const perGroupProds: PerGroupProd[] = []
  const flatProds: { pp_id: string; nome: string; num_escolas: number; num_alunos: number; tipoPublico: 'PorAluno' | 'PorEscola' }[] = []

  for (const pp of remainingProds) {
    const ppId = (pp as any).id
    const nomeProd: string = (pp.produto as any)?.nome ?? ''
    const comps = (remainingComps ?? []).filter((c: any) => c.proposta_produto_id === ppId)

    // Detectar padrão per-group: componentes com "aluno"/"aluna" + número E "prof"/"professor" + número
    const grupos: PerGroupGrupo[] = []
    for (let num = 1; num <= 9; num++) {
      const re = new RegExp(`\\b${num}\\b`)
      const alunosComp = comps.find((c: any) => {
        const n: string = ((c.componente as any)?.nome ?? '').toLowerCase()
        return (n.includes('aluno') || n.includes('aluna')) && re.test(n)
      })
      const profComp = comps.find((c: any) => {
        const n: string = ((c.componente as any)?.nome ?? '').toLowerCase()
        return n.includes('prof') && re.test(n)
      })
      if (alunosComp || profComp) {
        grupos.push({
          num,
          label: `${num}º`,
          alunosCompId: (alunosComp as any)?.id ?? null,
          profCompId:   (profComp as any)?.id   ?? null,
          alunosQty:    (alunosComp as any)?.quantidade ?? 0,
          profQty:      (profComp as any)?.quantidade   ?? 0,
        })
      }
    }

    if (grupos.length > 0) {
      perGroupProds.push({ ppId, nome: nomeProd, grupos })
    } else {
      const tipoCalcs: string[] = ((pp as any).componentes ?? []).map((c: any) => c.componente?.tipo_calculo ?? '')
      const isPorAluno = tipoCalcs.some(tc => tc === 'PorAluno' || tc === 'PorProfessor')
      const isPorEscola = tipoCalcs.some(tc => tc === 'PorEscola' || tc === 'PorEscolaXKit')
      const tipoPublico: 'PorAluno' | 'PorEscola' = (!isPorEscola && isPorAluno) ? 'PorAluno' : 'PorEscola'
      flatProds.push({
        pp_id: ppId,
        nome: nomeProd,
        num_escolas: (pp as any).num_escolas ?? 0,
        num_alunos: (pp as any).num_alunos ?? 0,
        tipoPublico,
      })
    }
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
      servicosFormacao={servicosFormacao}
      mpcPpId={(mpcProd as any)?.id}
      mpcNumEscolas={(mpcProd as any)?.num_escolas ?? 0}
      criaCodePpId={(criaCodeProd as any)?.id}
      criaCodeNumAlunos={(criaCodeProd as any)?.num_alunos ?? 0}
      flatProds={flatProds}
      perGroupProds={perGroupProds}
    />
  )
}
