import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApresentacaoCliente } from './apresentacao-cliente'

export default async function ApresentacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: proposta },
    { data: financeiro },
    { data: produtos },
    { data: configPdf },
    { data: allServicos },
  ] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, status,
        id, status, logo_url,
        cliente_nome_instituicao, validade_proposta, criado_em,
        apresentacao_titulo, apresentacao_introducao,
        apresentacao_objetivos, apresentacao_solucoes,
        apresentacao_cronograma, apresentacao_termos
      `)
      .eq('id', id)
      .single<any>(),
    supabase
      .from('proposta_financeiro')
      .select('receita_liquida, total_descontos, receita_bruta')
      .eq('proposta_id', id)
      .single<any>(),
    supabase
      .from('proposta_produtos')
      .select(`
        id,
        desconto_percent,
        produto:produtos(nome),
        componentes:proposta_componentes(
          id, quantidade, valor_venda_unit, desconto_percent,
          componente:produto_componentes(nome, categoria)
        )
      `)
      .eq('proposta_id', id)
      .order('ordem', { ascending: true }),
    supabase
      .from('configuracao_pdf')
      .select('empresa_nome, logo_url, proposta_subtitulo')
      .eq('ativo', true)
      .single<any>(),
    supabase
      .from('proposta_servicos')
      .select('id, quantidade, valor_venda_unit, desconto_percent, servico:produto_servicos(nome)')
      .eq('proposta_id', id)
      .gt('quantidade', 0),
  ])

  if (!proposta) notFound()

  // Deduplica serviços por nome (mantém maior quantidade)
  const servicosDeduplicados = (() => {
    const seen = new Map<string, any>()
    for (const s of (allServicos ?? []) as any[]) {
      const key = (s.servico?.nome ?? '').toLowerCase()
      const prev = seen.get(key)
      if (!prev || s.quantidade > prev.quantidade) seen.set(key, s)
    }
    return Array.from(seen.values())
  })()

  // Monta dados de investimento — serviços em seção separada no final
  const investimentoProdutos = [
    ...(produtos ?? [])
      .map((pp: any) => {
        const fatorProd = 1 - (pp.desconto_percent ?? 0) / 100
        const itens = (pp.componentes ?? [])
          .filter((c: any) => c.quantidade > 0)
          .map((c: any) => ({
            nome: c.componente?.nome ?? '',
            categoria: c.componente?.categoria ?? '',
            quantidade: c.quantidade,
            valorUnit: c.valor_venda_unit,
            total: c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100) * fatorProd,
            tipo: 'componente' as const,
          }))
        const totalProduto = itens.reduce((acc: number, i: any) => acc + i.total, 0)
        return { nome: pp.produto?.nome ?? '', itens, totalProduto }
      })
      .filter((pp: any) => pp.totalProduto > 0),
    ...(servicosDeduplicados.length > 0 ? [{
      nome: 'Formação e Assessoria',
      itens: servicosDeduplicados.map((s: any) => ({
        nome: s.servico?.nome ?? '',
        categoria: 'Serviço',
        quantidade: s.quantidade,
        valorUnit: s.valor_venda_unit,
        total: s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100),
        tipo: 'servico' as const,
      })),
      totalProduto: servicosDeduplicados.reduce(
        (acc: number, s: any) => acc + s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100),
        0
      ),
    }] : []),
  ]

  const dataEmissao = new Date(proposta.criado_em ?? Date.now()).toLocaleDateString('pt-BR')

  // Calcula total diretamente dos produtos já consultados (evita depender da view proposta_financeiro)
  const totalLiquidoCalculado = investimentoProdutos.reduce((acc, pp) => acc + pp.totalProduto, 0)

  return (
    <ApresentacaoCliente
      propostaId={id}
      clienteNome={proposta.cliente_nome_instituicao ?? ''}
      dataEmissao={dataEmissao}
      empresaNome={configPdf?.empresa_nome ?? 'EdTech Brasil'}
      empresaSubtitulo={configPdf?.proposta_subtitulo ?? 'Tecnologia Educacional'}
      logoUrl={proposta.logo_url ?? configPdf?.logo_url ?? null}
      investimentoProdutos={investimentoProdutos}
      totalLiquido={totalLiquidoCalculado || (financeiro?.receita_liquida ?? 0)}
      initialData={{
        titulo: proposta.apresentacao_titulo ?? '',
        introducao: proposta.apresentacao_introducao ?? '',
        objetivos: (proposta.apresentacao_objetivos as string[]) ?? [],
        solucoes: (proposta.apresentacao_solucoes as { titulo: string; descricao: string }[]) ?? [],
        cronograma: (proposta.apresentacao_cronograma as { etapa: string; duracao: string }[]) ?? [],
        termos: proposta.apresentacao_termos ?? '',
      }}
    />
  )
}
