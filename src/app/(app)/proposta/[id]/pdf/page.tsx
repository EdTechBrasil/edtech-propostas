import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/utils/format'
import { PrintTrigger, PrintButton, PrintLink, PrintTriggerManual } from './print-trigger'
import { PdfTemplateBackground } from './pdf-template-background'
import { DocumentoApresentacao } from '../apresentacao/documento-apresentacao'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function PDFPage({ params }: { params: Promise<{ id: string }> }) {
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
        id, status, orcamento_alvo,
        publico_descricao, repasse_tipo, repasse_valor,
        apresentacao_titulo, apresentacao_introducao,
        apresentacao_objetivos, apresentacao_solucoes,
        apresentacao_cronograma, apresentacao_termos,
        num_escolas, num_professores, num_alunos,
        num_alunos_pre_i, num_alunos_pre_ii,
        num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
        num_alunos_ano4, num_alunos_ano5, num_alunos_ano6,
        num_alunos_ano7, num_alunos_ano8, num_alunos_ano9,
        num_temas_pre_i, num_temas_pre_ii,
        num_temas_ano1, num_temas_ano2, num_temas_ano3,
        num_temas_ano4, num_temas_ano5, num_temas_ano6,
        num_temas_ano7, num_temas_ano8, num_temas_ano9,
        cliente_nome_instituicao, cliente_cnpj,
        cliente_responsavel, cliente_email, cliente_cidade,
        validade_proposta, criado_em,
        criador:usuarios!criado_por_usuario_id(nome)
      `)
      .eq('id', id)
      .single<any>(),
    supabase
      .from('proposta_financeiro')
      .select('receita_bruta, total_descontos, receita_liquida, custo_total, lucro_bruto, margem_percent')
      .eq('proposta_id', id)
      .single<any>(),
    supabase
      .from('proposta_produtos')
      .select(`
        id,
        num_escolas,
        desconto_percent,
        produto:produtos(nome, descricao),
        componentes:proposta_componentes(
          id, produto_componente_id, quantidade, valor_venda_unit, desconto_percent, obrigatorio,
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
      .select('empresa_nome, proposta_titulo, proposta_subtitulo, logo_url, rodape_condicoes, css_customizado, template_pdf_url')
      .eq('ativo', true)
      .single<{
        empresa_nome: string
        proposta_titulo: string
        proposta_subtitulo: string
        logo_url: string | null
        rodape_condicoes: string | null
        css_customizado: string | null
        template_pdf_url: string | null
      }>(),
  ])

  if (!proposta || proposta.status !== 'Pronta_pdf') notFound()

  const dataEmissao = new Date(proposta.criado_em).toLocaleDateString('pt-BR')
  const dataValidade = proposta.validade_proposta
    ? proposta.validade_proposta.slice(0, 10).split('-').reverse().join('/')
    : '—'

  // Total receita bruta por produto (soma componentes + serviços)
  function totalProduto(pp: any): number {
    const comp = (pp.componentes ?? []).reduce(
      (acc: number, c: any) => acc + c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100),
      0
    )
    const serv = (pp.servicos ?? []).reduce(
      (acc: number, s: any) => acc + s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100),
      0
    )
    return (comp + serv) * (1 - (pp.desconto_percent ?? 0) / 100)
  }

  // Monta dados de investimento para o DocumentoApresentacao
  // Deduplica componentes por nome (mantém o de maior quantidade em caso de duplicata)
  function deduplicarComps(comps: any[]) {
    const seen = new Map<string, any>()
    for (const c of comps) {
      const key = (c.componente?.nome ?? c.produto_componente_id ?? c.id).toLowerCase()
      const prev = seen.get(key)
      if (!prev || c.quantidade > prev.quantidade) seen.set(key, c)
    }
    return Array.from(seen.values())
  }

  const investimentoProdutos = (produtos ?? [])
    .map((pp: any) => {
      const fator = 1 - (pp.desconto_percent ?? 0) / 100
      const itens = [
        ...deduplicarComps(pp.componentes ?? []).filter((c: any) => c.quantidade > 0).map((c: any) => ({
          nome: c.componente?.nome ?? '',
          categoria: c.componente?.categoria ?? '',
          quantidade: c.quantidade,
          valorUnit: c.valor_venda_unit,
          total: c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100) * fator,
          tipo: 'componente' as const,
        })),
        ...(pp.servicos ?? []).filter((s: any) => s.quantidade > 0).map((s: any) => ({
          nome: s.servico?.nome ?? '',
          categoria: 'Serviço',
          quantidade: s.quantidade,
          valorUnit: s.valor_venda_unit,
          total: s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100) * fator,
          tipo: 'servico' as const,
        })),
      ]
      return { nome: pp.produto?.nome ?? '', itens, totalProduto: itens.reduce((a, i) => a + i.total, 0) }
    })
    .filter((pp: any) => pp.totalProduto > 0)

  const temApresentacao = !!(proposta.apresentacao_titulo || proposta.apresentacao_introducao)

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pdf-content, .pdf-content * { visibility: visible; }
          .documento-apresentacao, .documento-apresentacao * { visibility: visible; }
          .pdf-content { position: absolute; left: 0; top: 0; width: 100%; }
          .documento-apresentacao { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @page {
          size: A4;
          margin: 15mm 18mm;
        }
      `}</style>
      {configPdf?.css_customizado && (
        <style>{configPdf.css_customizado}</style>
      )}

      {/* Toolbar (hidden on print) */}
      <div className="no-print flex items-center gap-3 p-4 border-b bg-slate-50 print:hidden">
        <Link href={`/proposta/${id}/apresentacao`}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        {configPdf?.template_pdf_url ? (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Aguarde o template carregar para imprimir.
            </span>
            <PrintTriggerManual />
          </div>
        ) : (
          <>
            <span className="text-sm text-slate-400 flex-1">
              O PDF será aberto automaticamente. Se não abrir,{' '}
              <PrintLink />.
            </span>
            <PrintButton />
          </>
        )}
      </div>

      {/* Documento de Apresentação (WYSIWYG com o preview) */}
      {temApresentacao && (
        <div className="max-w-[794px] mx-auto my-6 shadow-sm">
          <DocumentoApresentacao
            empresaNome={configPdf?.empresa_nome ?? 'EdTech Brasil'}
            empresaSubtitulo={configPdf?.proposta_subtitulo ?? 'Tecnologia Educacional'}
            logoUrl={configPdf?.logo_url ?? null}
            dataEmissao={dataEmissao}
            titulo={proposta.apresentacao_titulo ?? ''}
            clienteNome={proposta.cliente_nome_instituicao ?? ''}
            introducao={proposta.apresentacao_introducao ?? undefined}
            objetivos={(proposta.apresentacao_objetivos as string[]) ?? undefined}
            solucoes={(proposta.apresentacao_solucoes as any[]) ?? undefined}
            cronograma={(proposta.apresentacao_cronograma as any[]) ?? undefined}
            termos={proposta.apresentacao_termos ?? undefined}
            investimentoProdutos={investimentoProdutos}
            totalLiquido={financeiro?.receita_liquida ?? 0}
            clienteCnpj={proposta.cliente_cnpj ?? undefined}
            clienteResponsavel={proposta.cliente_responsavel ?? undefined}
            clienteEmail={proposta.cliente_email ?? undefined}
            clienteCidade={proposta.cliente_cidade ?? undefined}
            dataValidade={proposta.validade_proposta ?? undefined}
          />
        </div>
      )}

      {/* PDF Content (layout técnico — oculto quando há apresentação) */}
      <div className={`pdf-content p-8 max-w-4xl mx-auto font-sans text-slate-800${temApresentacao ? ' hidden' : ''}`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-slate-800">
          <div>
            {configPdf?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={configPdf.logo_url} alt={configPdf.empresa_nome} className="h-12 object-contain mb-2" />
            ) : null}
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {configPdf?.proposta_titulo ?? 'PROPOSTA COMERCIAL'}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {configPdf?.proposta_subtitulo ?? 'Solução em Tecnologia Educacional'}
            </div>
          </div>
          <div className="text-right text-sm text-slate-500 space-y-0.5">
            <div>Emissão: <span className="font-medium text-slate-700">{dataEmissao}</span></div>
            <div>Validade: <span className="font-medium text-slate-700">{dataValidade}</span></div>
            <div className="font-mono text-xs text-slate-400">#{id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Dados do Cliente</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoField label="Instituição" value={proposta.cliente_nome_instituicao ?? '—'} full />
            <InfoField label="CNPJ" value={proposta.cliente_cnpj ?? '—'} />
            <InfoField label="Responsável" value={proposta.cliente_responsavel ?? '—'} />
            <InfoField label="E-mail" value={proposta.cliente_email ?? '—'} />
            <InfoField label="Cidade" value={proposta.cliente_cidade ?? '—'} />
          </div>
        </div>

        {/* Seções narrativas da apresentação */}
        {proposta.apresentacao_introducao && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Introdução</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposta.apresentacao_introducao}</p>
          </div>
        )}

        {Array.isArray(proposta.apresentacao_objetivos) && proposta.apresentacao_objetivos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Objetivos Principais</h2>
            <div className="grid grid-cols-2 gap-3">
              {(proposta.apresentacao_objetivos as string[]).map((obj, i) => (
                <div key={i} className="flex items-start gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(proposta.apresentacao_solucoes) && proposta.apresentacao_solucoes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Nossa Solução</h2>
            <div className="space-y-3">
              {(proposta.apresentacao_solucoes as { titulo: string; descricao: string }[]).map((s, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{s.titulo}</p>
                    {s.descricao && <p className="text-slate-500 mt-0.5">{s.descricao}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(proposta.apresentacao_cronograma) && proposta.apresentacao_cronograma.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Cronograma Estimado</h2>
            <div className="space-y-2">
              {(proposta.apresentacao_cronograma as { etapa: string; duracao: string }[]).map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 rounded-full border-2 border-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{c.etapa}</span>
                  {c.duracao && <span className="text-xs text-slate-400 uppercase tracking-wide">{c.duracao}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scope */}
        {proposta.num_escolas > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Escopo / Público-alvo</h2>
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-700">
              {/* Linha de totais globais */}
              <div className="flex gap-6 mb-3 pb-3 border-b border-slate-200 font-medium text-slate-800">
                <span>Escolas: <strong>{proposta.num_escolas}</strong></span>
                <span>Professores: <strong>{proposta.num_professores}</strong></span>
                <span>Total de alunos: <strong>{proposta.num_alunos}</strong></span>
              </div>
              {/* Detalhamento por série */}
              {(() => {
                const series = [
                  { label: 'Pré I',   alunos: proposta.num_alunos_pre_i,  temas: proposta.num_temas_pre_i  },
                  { label: 'Pré II',  alunos: proposta.num_alunos_pre_ii, temas: proposta.num_temas_pre_ii },
                  { label: '1º ano',  alunos: proposta.num_alunos_ano1,   temas: proposta.num_temas_ano1   },
                  { label: '2º ano',  alunos: proposta.num_alunos_ano2,   temas: proposta.num_temas_ano2   },
                  { label: '3º ano',  alunos: proposta.num_alunos_ano3,   temas: proposta.num_temas_ano3   },
                  { label: '4º ano',  alunos: proposta.num_alunos_ano4,   temas: proposta.num_temas_ano4   },
                  { label: '5º ano',  alunos: proposta.num_alunos_ano5,   temas: proposta.num_temas_ano5   },
                  { label: '6º ano',  alunos: proposta.num_alunos_ano6,   temas: proposta.num_temas_ano6   },
                  { label: '7º ano',  alunos: proposta.num_alunos_ano7,   temas: proposta.num_temas_ano7   },
                  { label: '8º ano',  alunos: proposta.num_alunos_ano8,   temas: proposta.num_temas_ano8   },
                  { label: '9º ano',  alunos: proposta.num_alunos_ano9,   temas: proposta.num_temas_ano9   },
                ].filter(s => (s.alunos ?? 0) > 0)

                const seriesNomes = ['Primeiro', 'Coding', 'Cria+Code', 'Inteligência Artificial', 'O Código IA']
                const flatProds = (produtos ?? []).filter((pp: any) => {
                  const nome: string = pp.produto?.nome ?? ''
                  return !seriesNomes.some(n => nome.includes(n))
                })

                const flatRows = flatProds.filter(() => proposta.num_alunos > 0)
                  .map((pp: any) => ({
                    label: pp.produto?.nome ?? '',
                    alunos: proposta.num_alunos,
                    temas: null as number | null,
                    escolas: ((pp.num_escolas ?? 0) > 0 ? pp.num_escolas : proposta.num_escolas) as number | null,
                  }))

                const seriesRows = series.map(s => ({ ...s, escolas: null as number | null }))
                const mpcProdPdf = (produtos ?? []).find((pp: any) => pp.produto?.nome?.includes('Primeiro'))
                const mpcEscolas = (mpcProdPdf as any)?.num_escolas > 0 ? (mpcProdPdf as any).num_escolas : null

                const allRows = [...seriesRows, ...flatRows]
                if (allRows.length === 0) return null
                return (
                  <>
                    {mpcEscolas && seriesRows.length > 0 && (
                      <p className="text-xs text-slate-500 mb-1">
                        Meu Primeiro Código — {mpcEscolas} escola{mpcEscolas !== 1 ? 's' : ''}
                      </p>
                    )}
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="text-left py-1 font-medium w-24">Série</th>
                          <th className="text-center py-1 font-medium w-20">Alunos</th>
                          <th className="text-center py-1 font-medium w-16">Temas</th>
                          <th className="text-center py-1 font-medium w-20">Escolas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allRows.map(s => (
                          <tr key={s.label}>
                            <td className="py-1 text-slate-600">{s.label}</td>
                            <td className="py-1 text-center text-slate-700 font-medium">{s.alunos ?? '—'}</td>
                            <td className="py-1 text-center text-slate-500">{s.temas != null && s.temas > 0 ? s.temas : '—'}</td>
                            <td className="py-1 text-center text-slate-500">{s.escolas != null && s.escolas > 0 ? s.escolas : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Composição da Proposta</h2>
          <div className="space-y-6">
            {(produtos ?? [])
              .filter((pp: any) =>
                (pp.componentes ?? []).some((c: any) => c.quantidade > 0) ||
                (pp.servicos ?? []).some((s: any) => s.quantidade > 0)
              )
              .map((pp: any) => (
              <div key={pp.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900">{pp.produto?.nome}</p>
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(totalProduto(pp))}</p>
                </div>

                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-xs text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Item</th>
                      <th className="text-center px-3 py-2 font-medium w-16">Qtd</th>
                      <th className="text-right px-3 py-2 font-medium w-28">Unit</th>
                      <th className="text-right px-3 py-2 font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deduplicarComps(pp.componentes ?? []).filter((c: any) => c.quantidade > 0).map((c: any) => {
                      const total = c.quantidade * c.valor_venda_unit * (1 - (c.desconto_percent ?? 0) / 100)
                      return (
                        <tr key={c.id}>
                          <td className="px-3 py-2 text-slate-700">
                            {c.componente?.nome}
                            {c.componente?.categoria && (
                              <span className="ml-2 text-xs text-slate-400">{c.componente.categoria}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-500">{c.quantidade}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(c.valor_venda_unit)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(total)}</td>
                        </tr>
                      )
                    })}
                    {(pp.servicos ?? []).filter((s: any) => s.quantidade > 0).map((s: any) => {
                      const total = s.quantidade * s.valor_venda_unit * (1 - (s.desconto_percent ?? 0) / 100)
                      return (
                        <tr key={s.id} className="bg-blue-50/40">
                          <td className="px-3 py-2 text-slate-700">
                            {s.servico?.nome}
                            <span className="ml-2 text-xs text-blue-400">serviço</span>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-500">{s.quantidade}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(s.valor_venda_unit)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Financial summary */}
        {financeiro && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Resumo Financeiro</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <SummaryRow label="Valor total (bruto)" value={formatCurrency(financeiro.receita_bruta)} />
                  {financeiro.total_descontos > 0 && (
                    <SummaryRow label="(-) Descontos aplicados" value={`-${formatCurrency(financeiro.total_descontos)}`} muted />
                  )}
                  <SummaryRow label="Valor líquido" value={formatCurrency(financeiro.receita_liquida)} highlight />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Repasse */}
        {proposta.repasse_tipo && proposta.repasse_tipo !== 'Nenhum' && (
          <div className="mb-8 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <span className="font-medium">Repasse previsto:</span> {proposta.repasse_tipo} — {formatCurrency(proposta.repasse_valor)}
          </div>
        )}

        {/* Termos e condições narrativos */}
        {proposta.apresentacao_termos && (
          <div className="mb-8 flex gap-3 text-sm text-slate-600">
            <span className="text-slate-400 mt-0.5">🛡</span>
            <div>
              <p className="font-semibold text-slate-700 mb-1">Termos e Condições</p>
              <p className="leading-relaxed">{proposta.apresentacao_termos}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-600 mb-1">Condições gerais</p>
              <p>{configPdf?.rodape_condicoes ?? `Proposta válida até ${dataValidade}. Valores sujeitos a revisão após o prazo de validade. Impostos não incluídos.`}</p>
            </div>
            <div className="text-right">
              <div className="mt-8 border-t border-slate-300 pt-2">
                <p className="text-slate-500">{proposta.criador?.nome ?? 'Comercial'}</p>
                <p>Responsável pela proposta</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {configPdf?.template_pdf_url ? (
        <PdfTemplateBackground url={configPdf.template_pdf_url} />
      ) : (
        <PrintTrigger />
      )}
    </>
  )
}

function InfoField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function SummaryRow({ label, value, muted, highlight }: {
  label: string; value: string; muted?: boolean; highlight?: boolean
}) {
  return (
    <tr className={highlight ? 'bg-slate-50 font-semibold' : ''}>
      <td className={`px-4 py-2.5 ${muted ? 'text-slate-400' : 'text-slate-600'}`}>{label}</td>
      <td className={`px-4 py-2.5 text-right ${highlight ? 'text-slate-900 text-base' : muted ? 'text-slate-400' : 'text-slate-700'}`}>
        {value}
      </td>
    </tr>
  )
}
