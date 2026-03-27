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
        componentes:proposta_componentes(quantidade, valor_venda_unit, desconto_percent),
        servicos:proposta_servicos(quantidade, valor_venda_unit, desconto_percent)
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

  // Calcula total por produto
  const investimentoItens = (produtos ?? [])
    .map((pp: any) => {
      const comp = (pp.componentes ?? []).reduce(
        (acc: number, c: any) => acc + c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100),
        0
      )
      const serv = (pp.servicos ?? []).reduce(
        (acc: number, s: any) => acc + s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100),
        0
      )
      const total = (comp + serv) * (1 - (pp.desconto_percent ?? 0) / 100)
      return { nome: pp.produto?.nome ?? '', total }
    })
    .filter((item: any) => item.total > 0)

  const dataEmissao = new Date(proposta.criado_em ?? Date.now()).toLocaleDateString('pt-BR')

  return (
    <ApresentacaoCliente
      propostaId={id}
      clienteNome={proposta.cliente_nome_instituicao ?? ''}
      dataEmissao={dataEmissao}
      empresaNome={configPdf?.empresa_nome ?? 'EdTech Brasil'}
      empresaSubtitulo={configPdf?.proposta_subtitulo ?? 'Tecnologia Educacional'}
      logoUrl={configPdf?.logo_url ?? null}
      investimentoItens={investimentoItens}
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
