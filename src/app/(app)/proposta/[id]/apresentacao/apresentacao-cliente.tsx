'use client'

import { useState, useTransition, useRef } from 'react'
import { salvarApresentacao } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DocumentoApresentacao } from './documento-apresentacao'

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
        <div className="max-w-[794px] mx-auto shadow-xl rounded-lg overflow-hidden">
          <DocumentoApresentacao
            empresaNome={empresaNome}
            empresaSubtitulo={empresaSubtitulo}
            logoUrl={logoUrl}
            dataEmissao={dataEmissao}
            titulo={titulo}
            clienteNome={clienteNome}
            introducao={introducao}
            objetivos={objetivos}
            solucoes={solucoes}
            cronograma={cronograma}
            termos={termos}
            investimentoProdutos={investimentoProdutos}
            totalLiquido={totalLiquido}
          />
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

