import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/utils/format'
import { PrintTrigger, PrintButton, PrintLink, PrintTriggerManual } from './print-trigger'
import { PdfTemplateBackground } from './pdf-template-background'
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
        desconto_percent,
        produto:produtos(nome, descricao),
        componentes:proposta_componentes(
          id, quantidade, valor_venda_unit, desconto_percent, obrigatorio,
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

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pdf-content, .pdf-content * { visibility: visible; }
          .pdf-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @page {
          size: A4;
          margin: 20mm 18mm;
        }
      `}</style>
      {configPdf?.css_customizado && (
        <style>{configPdf.css_customizado}</style>
      )}

      {/* Toolbar (hidden on print) */}
      <div className="no-print flex items-center gap-3 p-4 border-b bg-slate-50 print:hidden">
        <Link href={`/proposta/${id}/cliente`}>
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

      {/* PDF Content */}
      <div className="pdf-content p-8 max-w-4xl mx-auto font-sans text-slate-800">

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
                if (series.length === 0) return null
                return (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-1 font-medium w-24">Série</th>
                        <th className="text-center py-1 font-medium w-20">Alunos</th>
                        <th className="text-center py-1 font-medium w-20">Temas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {series.map(s => (
                        <tr key={s.label}>
                          <td className="py-1 text-slate-600">{s.label}</td>
                          <td className="py-1 text-center text-slate-700 font-medium">{s.alunos}</td>
                          <td className="py-1 text-center text-slate-500">{(s.temas ?? 0) > 0 ? s.temas : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    {(pp.componentes ?? []).filter((c: any) => c.quantidade > 0).map((c: any) => {
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
