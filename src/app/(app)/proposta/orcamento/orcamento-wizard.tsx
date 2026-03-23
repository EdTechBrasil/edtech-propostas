'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { gerarPropostaOrcamento, atualizarPrioridadePadrao } from '@/lib/actions/proposta'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Loader2, Wand2 } from 'lucide-react'

type Produto = {
  id: string
  nome: string
  tipo: string | null
  descricao: string | null
  prioridade_padrao: number
  series_atendidas: string[]
}

const SEGMENTO_SERIES: Record<string, string[]> = {
  educacaoInfantil: ['creche', 'pre_i', 'pre_ii'],
  anosIniciais:     ['ano1', 'ano2', 'ano3', 'ano4', 'ano5'],
  anosFinais:       ['ano6', 'ano7', 'ano8', 'ano9'],
  ensinoMedio:      ['em'],
  eja:              ['eja'],
}

type Segmento = {
  ativo: boolean
  escolas: string
  alunos: string
  professores: string
}

type ProjetoConfig = {
  incluir: boolean
  obrigatorio: boolean
  prioridade: number
  cobertura_minima: number
}

const BADGE_COLORS: Record<string, string> = {
  'Currículo': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Plataforma': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'IA': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Gamificação': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Robótica': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'Socioemocional': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'EJA': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'ENEM': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Redação': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Pensamento Computacional': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  const value = cents / 100
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function parseCurrency(display: string): number {
  const digits = display.replace(/\D/g, '')
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

export function OrcamentoWizard({ produtos }: { produtos: Produto[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2>(1)
  const [erro, setErro] = useState<string | null>(null)

  // Step 1
  const [orcamentoDisplay, setOrcamentoDisplay] = useState('')
  const [tolerancia, setTolerancia] = useState('2')
  const [objetivo, setObjetivo] = useState('BaterOrcamento')
  const [segmentos, setSegmentos] = useState<Record<string, Segmento>>({
    educacaoInfantil: { ativo: false, escolas: '', alunos: '', professores: '' },
    anosIniciais:     { ativo: false, escolas: '', alunos: '', professores: '' },
    anosFinais:       { ativo: false, escolas: '', alunos: '', professores: '' },
    ensinoMedio:      { ativo: false, escolas: '', alunos: '', professores: '' },
    eja:              { ativo: false, escolas: '', alunos: '', professores: '' },
  })
  const [formPresMin, setFormPresMin] = useState('')
  const [formPresMax, setFormPresMax] = useState('')
  const [formEadMin, setFormEadMin] = useState('')
  const [formEadMax, setFormEadMax] = useState('')
  const [assessMin, setAssessMin] = useState('')
  const [assessMax, setAssessMax] = useState('')

  // Step 2
  const [projetos, setProjetos] = useState<Record<string, ProjetoConfig>>(
    Object.fromEntries(
      produtos.map(p => [p.id, { incluir: true, obrigatorio: false, prioridade: p.prioridade_padrao ?? 3, cobertura_minima: 0 }])
    )
  )

  const segmentosLabel: Record<string, string> = {
    educacaoInfantil: 'Educação Infantil (Creche–Pré II)',
    anosIniciais:     'Anos Iniciais (1º–5º)',
    anosFinais:       'Anos Finais (6º–9º)',
    ensinoMedio:      'Ensino Médio',
    eja:              'EJA',
  }

  function updateSegmento(key: string, field: keyof Segmento, value: boolean | string) {
    setSegmentos(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function updateProjeto(id: string, field: keyof ProjetoConfig, value: boolean | number) {
    setProjetos(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  function handleOrcamentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    if (!digits) { setOrcamentoDisplay(''); return }
    const cents = parseInt(digits, 10)
    const value = cents / 100
    setOrcamentoDisplay(value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }))
  }

  function canContinue(): boolean {
    if (!orcamentoDisplay) return false
    const ativos = Object.values(segmentos).filter(s => s.ativo)
    if (ativos.length === 0) return false
    return ativos.every(s => parseInt(s.escolas || '0', 10) > 0 && parseInt(s.alunos || '0', 10) > 0)
  }

  async function handleGerar() {
    setErro(null)

    const orcamento_alvo = parseCurrency(orcamentoDisplay)
    const tol = parseFloat(tolerancia) || 2

    let num_escolas = 0, num_alunos = 0, num_professores = 0
    for (const seg of Object.values(segmentos)) {
      if (seg.ativo) {
        num_escolas    += parseInt(seg.escolas    || '0', 10)
        num_alunos     += parseInt(seg.alunos     || '0', 10)
        num_professores += parseInt(seg.professores || '0', 10)
      }
    }

    const produtos_selecionados = Object.entries(projetos)
      .filter(([, cfg]) => cfg.incluir)
      .map(([produto_id, cfg]) => ({
        produto_id,
        obrigatorio: cfg.obrigatorio,
        prioridade: cfg.prioridade,
      }))

    startTransition(async () => {
      const result = await gerarPropostaOrcamento({
        orcamento_alvo,
        tolerancia_percent: tol,
        objetivo,
        num_escolas,
        num_alunos,
        num_professores,
        formacao_presencial_min: parseInt(formPresMin || '0', 10),
        formacao_presencial_max: parseInt(formPresMax || '0', 10) || Infinity,
        formacao_ead_min: parseInt(formEadMin || '0', 10),
        formacao_ead_max: parseInt(formEadMax || '0', 10) || Infinity,
        assessoria_min: parseInt(assessMin || '0', 10),
        assessoria_max: parseInt(assessMax || '0', 10) || Infinity,
        produtos_selecionados,
      })

      if ('error' in result) {
        setErro(result.error)
        return
      }

      router.push(`/proposta/${result.propostaId}/publico`)
    })
  }

  const GerarBtn = (
    <Button onClick={handleGerar} disabled={isPending} size="lg" className="gap-2">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
      Gerar Proposta
    </Button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Proposta por Orçamento</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {step === 1 ? 'Passo 1 de 2 — Orçamento e público' : 'Passo 2 de 2 — Projetos'}
        </p>
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1 space-y-2">
                  <Label>Orçamento alvo (R$)</Label>
                  <Input
                    inputMode="numeric"
                    value={orcamentoDisplay}
                    onChange={handleOrcamentoChange}
                    placeholder="R$ 0,00"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tolerância (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={tolerancia}
                    onChange={e => setTolerancia(e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-slate-500">Margem acima do orçamento permitida</p>
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select value={objetivo} onValueChange={setObjetivo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BaterOrcamento">Bater orçamento</SelectItem>
                      <SelectItem value="MaximizarCobertura">Maximizar cobertura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segmentos de público</CardTitle>
              <CardDescription>Selecione os segmentos e informe as quantidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(segmentosLabel).map(([key, label]) => {
                const seg = segmentos[key]
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`seg-${key}`}
                        checked={seg.ativo}
                        onCheckedChange={v => updateSegmento(key, 'ativo', !!v)}
                      />
                      <Label htmlFor={`seg-${key}`} className="font-medium cursor-pointer">{label}</Label>
                    </div>
                    {seg.ativo && (
                      <div className="ml-6 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Escolas</Label>
                          <Input
                            type="number"
                            min={0}
                            value={seg.escolas}
                            onChange={e => updateSegmento(key, 'escolas', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Alunos</Label>
                          <Input
                            type="number"
                            min={0}
                            value={seg.alunos}
                            onChange={e => updateSegmento(key, 'alunos', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Professores</Label>
                          <Input
                            type="number"
                            min={0}
                            value={seg.professores}
                            onChange={e => updateSegmento(key, 'professores', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de formação e assessoria</CardTitle>
              <CardDescription>Faixas de horas aceitas (deixe em branco para não limitar)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Formação Presencial', min: formPresMin, setMin: setFormPresMin, max: formPresMax, setMax: setFormPresMax },
                  { label: 'Formação EAD', min: formEadMin, setMin: setFormEadMin, max: formEadMax, setMax: setFormEadMax },
                  { label: 'Assessoria', min: assessMin, setMin: setAssessMin, max: assessMax, setMax: setAssessMax },
                ].map(({ label, min, setMin, max, setMax }) => (
                  <div key={label} className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Mínimo (h)</Label>
                      <Input type="number" min={0} value={min} onChange={e => setMin(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Máximo (h)</Label>
                      <Input type="number" min={0} value={max} onChange={e => setMax(e.target.value)} placeholder="∞" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {(() => {
            const ativos = Object.values(segmentos).filter(s => s.ativo)
            const faltaCampos = ativos.some(
              s => parseInt(s.escolas || '0', 10) === 0 || parseInt(s.alunos || '0', 10) === 0
            )
            return ativos.length > 0 && faltaCampos ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-right">
                Preencha Escolas e Alunos em todos os segmentos ativos para continuar
              </p>
            ) : null
          })()}

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => {
                const activeSeries = Object.entries(segmentos)
                  .filter(([, s]) => s.ativo)
                  .flatMap(([seg]) => SEGMENTO_SERIES[seg] ?? [])
                setProjetos(prev => {
                  const updated = { ...prev }
                  for (const p of produtos) {
                    if (p.series_atendidas.length === 0) continue
                    updated[p.id] = { ...updated[p.id], incluir: p.series_atendidas.some(s => activeSeries.includes(s)) }
                  }
                  return updated
                })
                setStep(2)
              }}
              disabled={!canContinue()}
              className="gap-2"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-6">
          {erro && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
            {GerarBtn}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projetos</CardTitle>
              <CardDescription>
                Configure quais produtos incluir na proposta gerada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const activeSeries = Object.entries(segmentos)
                  .filter(([, s]) => s.ativo)
                  .flatMap(([seg]) => SEGMENTO_SERIES[seg] ?? [])

                const indicados = produtos.filter(p =>
                  p.series_atendidas.length === 0 || p.series_atendidas.some(s => activeSeries.includes(s))
                )
                const outros = produtos.filter(p =>
                  p.series_atendidas.length > 0 && !p.series_atendidas.some(s => activeSeries.includes(s))
                )

                function renderProduto(produto: Produto, isOutro = false) {
                  const cfg = projetos[produto.id]
                  const badgeClass = produto.tipo ? (BADGE_COLORS[produto.tipo] ?? 'bg-slate-100 text-slate-700') : ''
                  return (
                    <div
                      key={produto.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        cfg.incluir
                          ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Checkbox
                            id={`incluir-${produto.id}`}
                            checked={cfg.incluir}
                            onCheckedChange={v => updateProjeto(produto.id, 'incluir', !!v)}
                          />
                          <Label htmlFor={`incluir-${produto.id}`} className="cursor-pointer font-medium text-sm">
                            Incluir
                          </Label>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm truncate">{produto.nome}</span>
                            {produto.tipo && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                                {produto.tipo}
                              </span>
                            )}
                            {isOutro && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
                                fora do segmento
                              </span>
                            )}
                          </div>
                        </div>

                        {cfg.incluir && (
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`obrig-${produto.id}`}
                                checked={cfg.obrigatorio}
                                onCheckedChange={v => updateProjeto(produto.id, 'obrigatorio', !!v)}
                              />
                              <Label htmlFor={`obrig-${produto.id}`} className="text-xs cursor-pointer">Obrigatório</Label>
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-xs whitespace-nowrap">Prioridade</Label>
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                value={cfg.prioridade}
                                onChange={e => updateProjeto(produto.id, 'prioridade', Math.min(5, Math.max(1, parseInt(e.target.value) || 3)))}
                                onBlur={() => atualizarPrioridadePadrao(produto.id, cfg.prioridade)}
                                className="w-16 h-8 text-sm"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-xs whitespace-nowrap">Cobertura mín. %</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={cfg.cobertura_minima}
                                onChange={e => updateProjeto(produto.id, 'cobertura_minima', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-16 h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {indicados.map(p => renderProduto(p, false))}
                    </div>
                    {outros.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-2 border-t">
                          Fora dos segmentos selecionados
                        </p>
                        {outros.map(p => renderProduto(p, true))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pb-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
            {GerarBtn}
          </div>
        </div>
      )}
    </div>
  )
}
