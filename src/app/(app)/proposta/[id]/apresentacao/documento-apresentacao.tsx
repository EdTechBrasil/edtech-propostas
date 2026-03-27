import { formatCurrency } from '@/utils/format'

// ── Types ─────────────────────────────────────────────────────────────────────

type InvestimentoItemDetalhe = {
  nome: string
  categoria: string
  quantidade: number
  valorUnit: number
  total: number
  tipo: 'componente' | 'servico'
}

type InvestimentoProduto = {
  nome: string
  itens: InvestimentoItemDetalhe[]
  totalProduto: number
}

type DocumentoApresentacaoProps = {
  empresaNome: string
  empresaSubtitulo: string
  logoUrl: string | null
  dataEmissao: string
  titulo: string
  clienteNome: string
  introducao?: string
  objetivos?: string[]
  solucoes?: { titulo: string; descricao: string }[]
  cronograma?: { etapa: string; duracao: string }[]
  termos?: string
  investimentoProdutos?: InvestimentoProduto[]
  totalLiquido?: number
  clienteCnpj?: string
  clienteResponsavel?: string
  clienteEmail?: string
  clienteCidade?: string
  dataValidade?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentoApresentacao({
  empresaNome,
  empresaSubtitulo,
  logoUrl,
  dataEmissao,
  titulo,
  clienteNome,
  introducao,
  objetivos,
  solucoes,
  cronograma,
  termos,
  investimentoProdutos,
  totalLiquido,
  clienteCnpj,
  clienteResponsavel,
  clienteEmail,
  clienteCidade,
  dataValidade,
}: DocumentoApresentacaoProps) {
  const tituloDisplay = titulo.trim() || 'Proposta Comercial'
  const clienteDisplay = clienteNome.trim() || 'Cliente'
  const temObjetivos = (objetivos ?? []).filter(o => o.trim()).length > 0
  const temSolucoes = (solucoes ?? []).filter(s => s.titulo.trim()).length > 0
  const temCronograma = (cronograma ?? []).filter(c => c.etapa.trim()).length > 0
  const temInvestimento = (investimentoProdutos ?? []).length > 0 && (totalLiquido ?? 0) > 0
  const temClienteCompleto = !!clienteCnpj

  let sectionCount = 0
  const nextSection = () => {
    sectionCount++
    return String(sectionCount).padStart(2, '0')
  }

  return (
    <div className="documento-apresentacao relative bg-white font-sans text-slate-800 border-l-4 border-teal-600">

      {/* ── CABEÇALHO ─────────────────────────────────────────────────── */}
      <div className="px-10 pt-10 pb-8 border-b border-slate-100">

        {/* Identidade + Data */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={empresaNome} className="h-10 object-contain" />
            ) : (
              <div className="flex items-center -space-x-1.5">
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm z-10">
                  {empresaNome.charAt(0).toLowerCase()}
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {empresaNome.charAt(1)?.toLowerCase() ?? 'd'}
                </div>
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none tracking-tight">{empresaNome}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">{empresaSubtitulo}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Data da Proposta</p>
            <p className="text-sm font-bold text-slate-800">{dataEmissao}</p>
            {dataValidade && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2 mb-0.5">Válida até</p>
                <p className="text-sm font-bold text-slate-800">
                  {dataValidade.slice(0, 10).split('-').reverse().join('/')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Título principal */}
        <div className="mb-6">
          <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Proposta de{' '}
            <span className="text-teal-600">{tituloDisplay}</span>
          </h1>
          <div className="w-14 h-[3px] bg-yellow-400 rounded-full mt-4" />
        </div>

        {/* Badge cliente */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {clienteDisplay}
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Confidencial
          </div>
        </div>
      </div>

      {/* ── DADOS DO CLIENTE (versão PDF completa) ────────────────────── */}
      {temClienteCompleto && (
        <div className="px-10 py-4 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            <InfoCampo label="Instituição" value={clienteNome} span={3} />
            {clienteCnpj && <InfoCampo label="CNPJ" value={clienteCnpj} />}
            {clienteResponsavel && <InfoCampo label="Responsável" value={clienteResponsavel} />}
            {clienteEmail && <InfoCampo label="E-mail" value={clienteEmail} />}
            {clienteCidade && <InfoCampo label="Cidade" value={clienteCidade} />}
          </div>
        </div>
      )}

      {/* ── SEÇÕES NARRATIVAS ─────────────────────────────────────────── */}
      <div className="px-10 py-8 space-y-10">

        {/* 01. Introdução */}
        {introducao?.trim() && (
          <Secao numero={nextSection()} titulo="Introdução">
            <p className="text-sm text-slate-600 leading-relaxed">{introducao}</p>
          </Secao>
        )}

        {/* 02. Objetivos Principais */}
        {temObjetivos && (
          <Secao numero={nextSection()} titulo="Objetivos Principais">
            <div className="grid grid-cols-2 gap-3">
              {(objetivos ?? []).filter(o => o.trim()).map((obj, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 border-l-4 border-l-teal-500 rounded-r-lg px-4 py-3 shadow-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700 leading-snug">{obj}</span>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* 03. Nossa Solução */}
        {temSolucoes && (
          <Secao numero={nextSection()} titulo="Nossa Solução">
            <div className="space-y-4">
              {(solucoes ?? []).filter(s => s.titulo.trim()).map((sol, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {i + 1}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-slate-900">{sol.titulo}</p>
                    {sol.descricao?.trim() && (
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{sol.descricao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* 04. Cronograma */}
        {temCronograma && (
          <Secao numero={nextSection()} titulo="Cronograma Estimado">
            <div className="relative pl-4">
              {/* Linha vertical */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-4">
                {(cronograma ?? []).filter(c => c.etapa.trim()).map((item, i) => (
                  <div key={i} className="relative flex items-center gap-4">
                    <div className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-500 z-10" />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate">{item.etapa}</span>
                      {item.duracao?.trim() && (
                        <span className="flex-shrink-0 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 uppercase tracking-wide">
                          {item.duracao}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Secao>
        )}

        {/* 05. Investimento */}
        {temInvestimento && (
          <Secao numero={nextSection()} titulo="Investimento">
            <div className="space-y-5">
              {(investimentoProdutos ?? []).map((pp, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-slate-200">
                  {/* Cabeçalho do produto */}
                  <div className="flex items-center justify-between bg-teal-50 px-4 py-2.5 border-b border-teal-100">
                    <p className="text-sm font-semibold text-teal-800">{pp.nome}</p>
                    <p className="text-sm font-bold text-teal-700">{formatCurrency(pp.totalProduto)}</p>
                  </div>
                  {/* Itens */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[440px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="text-left px-4 py-2 font-medium">Item</th>
                          <th className="text-center px-3 py-2 font-medium w-14">Qtd</th>
                          <th className="text-right px-4 py-2 font-medium w-28">Unit</th>
                          <th className="text-right px-4 py-2 font-medium w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pp.itens.map((item, j) => (
                          <tr key={j} className={`border-b border-slate-50 last:border-0 ${item.tipo === 'servico' ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-4 py-2 text-slate-700">
                              {item.nome}
                              {item.tipo === 'servico' && (
                                <span className="ml-2 text-[10px] font-medium text-blue-400 bg-blue-50 rounded px-1.5 py-0.5">serviço</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-500">{item.quantidade}</td>
                            <td className="px-4 py-2 text-right text-slate-500">{formatCurrency(item.valorUnit)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Card total */}
              <div className="rounded-xl bg-slate-800 px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">Total do Projeto</p>
                  <p className="text-xs text-slate-500">Valor líquido após descontos</p>
                </div>
                <p className="text-2xl font-black text-yellow-400 tracking-tight">
                  {formatCurrency(totalLiquido ?? 0)}
                </p>
              </div>
            </div>
          </Secao>
        )}

        {/* Termos e Condições */}
        {termos?.trim() && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-5 py-4 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Termos e Condições</p>
              <p className="text-sm text-slate-500 leading-relaxed">{termos}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── RODAPÉ ────────────────────────────────────────────────────── */}
      <div className="px-10 pb-8 pt-5 border-t border-slate-100">
        <div className="flex items-end justify-between text-xs text-slate-400">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Contato</p>
            <p className="text-slate-600 font-medium">{empresaNome}</p>
            <p>{empresaSubtitulo}</p>
          </div>
          <div className="text-right">
            <div className="border-t border-slate-200 pt-2 mt-6">
              <p className="text-slate-500 font-medium">Responsável pela proposta</p>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mt-0.5">
                Assinatura {empresaNome}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: string
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-black text-teal-600 tracking-widest uppercase">{numero}.</span>
        <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">{titulo}</span>
        <div className="flex-1 h-px bg-teal-100" />
      </div>
      {children}
    </div>
  )
}

function InfoCampo({
  label,
  value,
  span,
}: {
  label: string
  value: string
  span?: number
}) {
  return (
    <div className={span ? `col-span-${span}` : ''}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-medium text-slate-700">{value}</p>
    </div>
  )
}
