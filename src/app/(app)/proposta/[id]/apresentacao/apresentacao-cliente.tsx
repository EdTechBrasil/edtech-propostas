'use client'

import { useState, useTransition, useRef } from 'react'
import { salvarApresentacao } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/utils/format'

type Solucao = { titulo: string; descricao: string }
type CronogramaItem = { etapa: string; duracao: string }

type InitialData = {
  titulo: string
  introducao: string
  objetivos: string[]
  solucoes: Solucao[]
  cronograma: CronogramaItem[]
  termos: string
}

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

export function ApresentacaoCliente({
  propostaId,
  clienteNome,
  dataEmissao,
  empresaNome,
  empresaSubtitulo,
  logoUrl,
  investimentoProdutos,
  totalLiquido,
  initialData,
}: {
  propostaId: string
  clienteNome: string
  dataEmissao: string
  empresaNome: string
  empresaSubtitulo: string
  logoUrl: string | null
  investimentoProdutos: InvestimentoProduto[]
  totalLiquido: number
  initialData: InitialData
}) {
  const [titulo, setTitulo] = useState(initialData.titulo)
  const [introducao, setIntroducao] = useState(initialData.introducao)
  const [objetivos, setObjetivos] = useState<string[]>(initialData.objetivos.length > 0 ? initialData.objetivos : [''])
  const [solucoes, setSolucoes] = useState<Solucao[]>(initialData.solucoes.length > 0 ? initialData.solucoes : [{ titulo: '', descricao: '' }])
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(initialData.cronograma.length > 0 ? initialData.cronograma : [{ etapa: '', duracao: '' }])
  const [termos, setTermos] = useState(initialData.termos)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('titulo', titulo)
    fd.set('introducao', introducao)
    fd.set('objetivos', JSON.stringify(objetivos.filter(o => o.trim())))
    fd.set('solucoes', JSON.stringify(solucoes.filter(s => s.titulo.trim())))
    fd.set('cronograma', JSON.stringify(cronograma.filter(c => c.etapa.trim())))
    fd.set('termos', termos)
    startTransition(() => salvarApresentacao(propostaId, fd))
  }

  const tituloDisplay = titulo.trim() || 'Sua Proposta'
  const clienteDisplay = clienteNome || 'Cliente'

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] -mx-4 md:-mx-8 -mt-4 md:-mt-8 overflow-hidden">

      {/* ── Painel esquerdo: editor ───────────────────────────────────── */}
      <div className="w-[420px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Apresentação</h1>
              <p className="text-xs text-slate-400 mt-0.5">Monte o documento comercial da proposta</p>
            </div>
            <Link href={`/proposta/${propostaId}/cliente`}>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-slate-500">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            </Link>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

            {/* Informações básicas */}
            <Section title="Informações Básicas">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título do projeto</Label>
                  <Input
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ex: Transformação Digital Educacional"
                  />
                </div>
              </div>
            </Section>

            {/* Introdução */}
            <Section title="Introdução">
              <textarea
                value={introducao}
                onChange={e => setIntroducao(e.target.value)}
                placeholder="Descreva a proposta de valor para o cliente..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </Section>

            {/* Objetivos */}
            <Section
              title="Objetivos"
              onAdd={() => setObjetivos(prev => [...prev, ''])}
            >
              <div className="space-y-2">
                {objetivos.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={obj}
                      onChange={e => setObjetivos(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                      placeholder={`Objetivo ${i + 1}`}
                    />
                    {objetivos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setObjetivos(prev => prev.filter((_, j) => j !== i))}
                        className="p-2 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Soluções */}
            <Section
              title="Soluções"
              onAdd={() => setSolucoes(prev => [...prev, { titulo: '', descricao: '' }])}
            >
              <div className="space-y-3">
                {solucoes.map((sol, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={sol.titulo}
                        onChange={e => setSolucoes(prev => prev.map((s, j) => j === i ? { ...s, titulo: e.target.value } : s))}
                        placeholder="Título da solução"
                        className="font-medium"
                      />
                      {solucoes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSolucoes(prev => prev.filter((_, j) => j !== i))}
                          className="p-2 text-slate-400 hover:text-red-500 rounded flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={sol.descricao}
                      onChange={e => setSolucoes(prev => prev.map((s, j) => j === i ? { ...s, descricao: e.target.value } : s))}
                      placeholder="Descrição breve..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* Cronograma */}
            <Section
              title="Cronograma"
              onAdd={() => setCronograma(prev => [...prev, { etapa: '', duracao: '' }])}
            >
              <div className="space-y-2">
                {cronograma.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item.etapa}
                      onChange={e => setCronograma(prev => prev.map((c, j) => j === i ? { ...c, etapa: e.target.value } : c))}
                      placeholder="Etapa"
                      className="flex-1"
                    />
                    <Input
                      value={item.duracao}
                      onChange={e => setCronograma(prev => prev.map((c, j) => j === i ? { ...c, duracao: e.target.value } : c))}
                      placeholder="Duração"
                      className="w-28"
                    />
                    {cronograma.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCronograma(prev => prev.filter((_, j) => j !== i))}
                        className="p-2 text-slate-400 hover:text-red-500 rounded flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Termos */}
            <Section title="Termos e Condições">
              <textarea
                value={termos}
                onChange={e => setTermos(e.target.value)}
                placeholder="Ex: Esta proposta tem validade de 15 dias. O pagamento pode ser parcelado em até 10x..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </Section>

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isPending ? 'Salvando...' : 'Salvar e gerar PDF'}
            </Button>

          </form>
        </div>
      </div>

      {/* ── Painel direito: preview ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800 p-6">
        <div className="max-w-[680px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden font-sans">

          {/* Cabeçalho do documento */}
          <div className="px-10 pt-10 pb-6 border-b border-slate-100">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={empresaNome} className="h-10 object-contain" />
                ) : (
                  <div className="flex -space-x-1">
                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">e</div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">d</div>
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-none">{empresaNome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{empresaSubtitulo.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Data da Proposta</p>
                <p className="text-sm font-bold text-slate-800">{dataEmissao}</p>
              </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 leading-tight mb-1">
              Proposta de{' '}
              <span className="text-teal-600">{tituloDisplay}</span>
            </h1>
            <div className="w-12 h-1 bg-yellow-400 rounded mt-3 mb-4" />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>👤 {clienteDisplay}</span>
              <span>·</span>
              <span>🛡 Confidencial</span>
            </div>
          </div>

          <div className="px-10 py-8 space-y-8">

            {/* 01. Introdução */}
            {introducao.trim() && (
              <PreviewSection number="01" title="Introdução">
                <p className="text-sm text-slate-600 leading-relaxed">{introducao}</p>
              </PreviewSection>
            )}

            {/* 02. Objetivos */}
            {objetivos.some(o => o.trim()) && (
              <PreviewSection number="02" title="Objetivos Principais">
                <div className="grid grid-cols-2 gap-2">
                  {objetivos.filter(o => o.trim()).map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 border border-teal-100 bg-teal-50 rounded-lg px-3 py-2.5 text-sm text-slate-700">
                      <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {/* 03. Soluções */}
            {solucoes.some(s => s.titulo.trim()) && (
              <PreviewSection number="03" title="Nossa Solução">
                <div className="space-y-3">
                  {solucoes.filter(s => s.titulo.trim()).map((sol, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{sol.titulo}</p>
                        {sol.descricao && <p className="text-slate-500 mt-0.5">{sol.descricao}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {/* 04. Cronograma */}
            {cronograma.some(c => c.etapa.trim()) && (
              <PreviewSection number="04" title="Cronograma Estimado">
                <div className="space-y-2">
                  {cronograma.filter(c => c.etapa.trim()).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 rounded-full border-2 border-teal-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800">{item.etapa}</span>
                      {item.duracao && (
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{item.duracao}</span>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {/* 05. Investimento */}
            {investimentoProdutos.length > 0 && (
              <PreviewSection number="05" title="Investimento">
                <div className="space-y-4">
                  {investimentoProdutos.map((pp, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-slate-800">{pp.nome}</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(pp.totalProduto)}</p>
                      </div>
                      <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400">
                            <th className="text-left px-3 py-1.5 font-medium">Item</th>
                            <th className="text-center px-2 py-1.5 font-medium w-12">Qtd</th>
                            <th className="text-right px-3 py-1.5 font-medium w-24">Unit</th>
                            <th className="text-right px-3 py-1.5 font-medium w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pp.itens.map((item, j) => (
                            <tr key={j} className={item.tipo === 'servico' ? 'bg-blue-50/40' : ''}>
                              <td className="px-3 py-1.5 text-slate-700">
                                {item.nome}
                                {item.categoria && item.tipo === 'servico' && (
                                  <span className="ml-1.5 text-[10px] text-blue-400">serviço</span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-center text-slate-500">{item.quantidade}</td>
                              <td className="px-3 py-1.5 text-right text-slate-600">{formatCurrency(item.valorUnit)}</td>
                              <td className="px-3 py-1.5 text-right font-medium text-slate-800">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  {/* Total geral */}
                  <div className="rounded-xl bg-slate-800 px-5 py-4 text-white flex items-center justify-between">
                    <span className="font-semibold">Total do Projeto</span>
                    <span className="text-xl font-black text-yellow-400">{formatCurrency(totalLiquido)}</span>
                  </div>
                </div>
              </PreviewSection>
            )}

            {/* Termos */}
            {termos.trim() && (
              <div className="flex gap-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
                <span className="text-slate-400 mt-0.5 flex-shrink-0">🛡</span>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Termos e Condições</p>
                  <p className="leading-relaxed">{termos}</p>
                </div>
              </div>
            )}

            {/* Rodapé */}
            <div className="border-t border-slate-100 pt-6 flex items-end justify-between text-xs text-slate-400">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Contato</p>
                <p className="text-slate-600 font-medium">{empresaNome.toLowerCase().replace(' ', '') + '.com.br'}</p>
              </div>
              <p className="uppercase tracking-widest font-semibold">Assinatura {empresaNome}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Section({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-teal-600">{title}</h3>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function PreviewSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-3">
        {number}. {title}
      </p>
      {children}
    </div>
  )
}
