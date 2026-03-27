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
  ] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, status,
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
        ),
        servicos:proposta_servicos(
          id, quantidade, valor_venda_unit, desconto_percent,
          servico:produto_servicos(nome)
        )
      `)
      .eq('proposta_id', id)
      .order('criado_em', { ascending: true }),
    supabase
      .from('configuracao_pdf')
      .select('empresa_nome, logo_url, proposta_subtitulo')
      .eq('ativo', true)
      .single<any>(),
  ])

  if (!proposta) notFound()

  // Monta dados completos de investimento por produto
  const investimentoProdutos = (produtos ?? [])
    .map((pp: any) => {
      const fatorProd = 1 - (pp.desconto_percent ?? 0) / 100
      const itens = [
        ...(pp.componentes ?? [])
          .filter((c: any) => c.quantidade > 0)
          .map((c: any) => ({
            nome: c.componente?.nome ?? '',
            categoria: c.componente?.categoria ?? '',
            quantidade: c.quantidade,
            valorUnit: c.valor_venda_unit,
            total: c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100) * fatorProd,
            tipo: 'componente' as const,
          })),
        ...(pp.servicos ?? [])
          .filter((s: any) => s.quantidade > 0)
          .map((s: any) => ({
            nome: s.servico?.nome ?? '',
            categoria: 'Serviço',
            quantidade: s.quantidade,
            valorUnit: s.valor_venda_unit,
            total: s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100) * fatorProd,
            tipo: 'servico' as const,
          })),
      ]
      const totalProduto = itens.reduce((acc, i) => acc + i.total, 0)
      return { nome: pp.produto?.nome ?? '', itens, totalProduto }
    })
    .filter((pp: any) => pp.totalProduto > 0)

  const dataEmissao = new Date(proposta.criado_em ?? Date.now()).toLocaleDateString('pt-BR')

  return (
    <ApresentacaoCliente
      propostaId={id}
      clienteNome={proposta.cliente_nome_instituicao ?? ''}
      dataEmissao={dataEmissao}
      empresaNome={configPdf?.empresa_nome ?? 'EdTech Brasil'}
      empresaSubtitulo={configPdf?.proposta_subtitulo ?? 'Tecnologia Educacional'}
      logoUrl={configPdf?.logo_url ?? null}
      investimentoProdutos={investimentoProdutos}
      totalLiquido={financeiro?.receita_liquida ?? 0}
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
