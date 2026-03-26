'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarComponente, atualizarServico, atualizarNumKits, reordenarCatalogo } from '@/lib/actions/proposta'
import { TAPETE_TYPES, TAPETE_KEYS, TAPETE_MULT } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { DragHandle } from '@/components/ui/drag-handle'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Componente {
  id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  componente: { id: string; nome: string; categoria: string; tipo_calculo: string; ordem: number } | null
}

interface Servico {
  id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  servico: { id: string; nome: string; tipo_calculo: string; valor_venda_base: number; ordem: number } | null
}

interface ProdutoProposta {
  id: string
  produto: { nome: string } | null
  componentes: Componente[]
  servicos: Servico[]
}

interface ItemState {
  qtd: number
  valor: number
  custo: number
}

interface Props {
  propostaId: string
  limiteOrcamento: number
  numProfessores: number
  numAlunos: number
  numAlunosEdtechIA: number
  numEscolas: number
  numTemas: number
  numKits: number
  temMPC: boolean
  seriesTapetes: string | null
  temasPorSerie: Record<string, number>
  alunosPorSerie: Record<string, number>
  numLivrosGuia: number
  produtos: ProdutoProposta[]
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  nome,
  categoria,
  qtd,
  valor,
  custo,
  hint,
  obrigatorio,
  dragHandleProps,
  onQtdChange,
  onValorChange,
  onSave,
}: {
  nome: string
  categoria?: string
  qtd: number
  valor: number
  custo: number
  hint: { text: string; type: 'info' | 'warn' } | null
  obrigatorio?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  onQtdChange: (v: number) => void
  onValorChange: (v: number) => void
  onSave: () => void
}) {
  const [, startTransition] = useTransition()
  const [qtdFocused, setQtdFocused] = useState(false)
  const [valorFocused, setValorFocused] = useState(false)
  const total = qtd * valor
  const margemItem = valor > 0 ? ((valor - custo) / valor) * 100 : null
  const margemCor =
    margemItem === null ? 'text-slate-400' :
    margemItem >= 20    ? 'text-green-600' :
    margemItem >= 12    ? 'text-amber-500' :
    'text-red-500'

  const alertaObrigatorio = obrigatorio && qtd === 0

  return (
    <div className={`py-3 border-b last:border-0 ${alertaObrigatorio ? 'border-red-300 bg-red-50/40 dark:bg-red-950/10 rounded px-2' : 'border-slate-100'}`}>
      <div className="flex items-center gap-3">
        {dragHandleProps && (
          <DragHandle {...dragHandleProps} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-800 truncate">{nome}</span>
            {categoria && <Badge variant="outline" className="text-xs">{categoria}</Badge>}
            {alertaObrigatorio && <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Obrigatório · Qtd 0</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-28">
            <Input
              type="number"
              min="0"
              step="1"
              value={qtdFocused && qtd === 0 ? '' : qtd}
              onChange={e => onQtdChange(e.target.value === '' ? 0 : Number(e.target.value))}
              onFocus={e => { setQtdFocused(true); e.target.select() }}
              onBlur={() => { setQtdFocused(false); startTransition(onSave) }}
              className="h-8 text-sm text-center"
              aria-label={`Quantidade de ${nome}`}
              title="Quantidade"
            />
          </div>
          <span className="text-slate-400 text-sm">×</span>
          <div className="w-32">
            <Input
              type="text"
              inputMode="decimal"
              value={valorFocused ? (valor === 0 ? '' : String(valor)) : formatCurrency(valor)}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d.]/g, '')
                onValorChange(raw === '' ? 0 : parseFloat(raw) || 0)
              }}
              onFocus={e => { setValorFocused(true); setTimeout(() => e.target.select(), 0) }}
              onBlur={() => { setValorFocused(false); startTransition(onSave) }}
              className="h-8 text-sm text-right"
              title="Valor venda unitário"
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 w-32 text-right" title="Total venda">
            {formatCurrency(total)}
          </span>
          <span className={`text-sm font-medium w-16 text-right ${margemCor}`} title="Margem por item">
            {margemItem !== null ? `${margemItem.toFixed(1)}%` : ''}
          </span>
        </div>
      </div>

      {hint && (
        <p role="status" aria-live="polite" className={`text-xs mt-1 ${hint.type === 'warn' ? 'text-amber-600' : 'text-blue-500'}`}>
          {hint.text}
        </p>
      )}
    </div>
  )
}

// ─── SortableItemRow ──────────────────────────────────────────────────────────

function SortableItemRow({ sortableId, ...props }: { sortableId: string } & React.ComponentProps<typeof ItemRow>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="group"
    >
      <ItemRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// ─── Painel de Resumo ao Vivo ────────────────────────────────────────────────

function ResumoAoVivo({
  receitaBruta,
  custoTotal,
  margem,
  limiteOrcamento,
}: {
  receitaBruta: number
  custoTotal: number
  margem: number
  limiteOrcamento: number
}) {
  const orcamentoPercent = limiteOrcamento > 0
    ? Math.min((receitaBruta / limiteOrcamento) * 100, 100)
    : 0

  const margemCor =
    margem >= 20 ? 'text-green-600' :
    margem >= 12 ? 'text-amber-500' :
    'text-red-500'

  const margemBg =
    margem >= 20 ? 'bg-green-50 border-green-200' :
    margem >= 12 ? 'bg-amber-50 border-amber-200' :
    'bg-red-50 border-red-200'

  const MargemIcon = margem >= 20 ? TrendingUp : margem >= 12 ? Minus : TrendingDown

  const orcamentoCor = orcamentoPercent >= 100
    ? 'bg-red-500'
    : orcamentoPercent >= 85
    ? 'bg-amber-400'
    : 'bg-green-500'

  return (
    <Card className="border-slate-200 bg-slate-50 mb-6">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Resumo financeiro ao vivo
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Receita Bruta */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Receita Bruta</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(receitaBruta)}</p>
          </div>

          {/* Custo Total */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Custo Total</p>
            <p className="text-lg font-bold text-slate-700">{formatCurrency(custoTotal)}</p>
          </div>

          {/* Margem */}
          <div className={`rounded-lg border px-3 py-2 ${margemBg}`}>
            <p className="text-xs text-slate-500 mb-1">Margem Estimada</p>
            <div className="flex items-center gap-1">
              <MargemIcon className={`w-4 h-4 ${margemCor}`} />
              <p className={`text-lg font-bold ${margemCor}`}>
                {receitaBruta > 0 ? `${margem.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>

          {/* vs Orçamento */}
          <div>
            <p className="text-xs text-slate-500 mb-1">
              vs Limite ({formatCurrency(limiteOrcamento)})
            </p>
            <p className="text-lg font-bold text-slate-800">{orcamentoPercent.toFixed(0)}%</p>
          </div>
        </div>

        {/* Barra de orçamento */}
        {limiteOrcamento > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>R$ 0</span>
              <span>Limite: {formatCurrency(limiteOrcamento)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${orcamentoCor}`}
                style={{ width: `${orcamentoPercent}%` }}
              />
            </div>
            {orcamentoPercent >= 100 && (
              <p className="text-xs text-red-500 mt-1">
                Receita excede o limite máximo do orçamento
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── ComponentesCliente (raiz) ────────────────────────────────────────────────

export function ComponentesCliente({
  propostaId,
  limiteOrcamento,
  numProfessores,
  numAlunos,
  numAlunosEdtechIA,
  numEscolas,
  numTemas,
  numKits,
  temMPC,
  seriesTapetes,
  temasPorSerie,
  alunosPorSerie,
  numLivrosGuia,
  produtos,
}: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [numKitsState, setNumKitsState] = useState(numKits)
  const [kitsInput, setKitsInput] = useState(String(numKits))
  const [, startKitsTransition] = useTransition()
  const [, startReorderTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor))

  const seriesTapetesState = seriesTapetes

  // Estado global: todos os items (componentes + serviços) de todos os produtos
  const [items, setItems] = useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    for (const pp of produtos) {
      for (const c of pp.componentes) {
        initial[c.id] = { qtd: c.quantidade, valor: c.valor_venda_unit, custo: c.custo_interno_unit }
      }
      for (const s of pp.servicos) {
        let qtd = s.quantidade
        if (qtd <= 1) {
          const nome = s.servico?.nome?.toLowerCase() ?? ''
          if (nome.includes('presencial')) qtd = 8
          else if (nome.includes('ead')) qtd = 10
          else if (nome.includes('assessoria')) qtd = 10
        }
        initial[s.id] = { qtd, valor: s.valor_venda_unit || (s.servico?.valor_venda_base ?? 0), custo: s.custo_interno_unit }
      }
    }
    return initial
  })

  // Ordem dos catálogo-ids por produto (componenteOrdens e servicoOrdens)
  const [componenteOrdens, setComponenteOrdens] = useState<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {}
    for (const pp of produtos) {
      result[pp.id] = pp.componentes
        .filter(c => c.componente !== null)
        .map(c => c.componente!.id)
    }
    return result
  })

  const [servicoOrdens, setServicoOrdens] = useState<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {}
    for (const pp of produtos) {
      result[pp.id] = pp.servicos
        .filter(s => s.servico !== null)
        .map(s => s.servico!.id)
    }
    return result
  })

  function updateItem(id: string, patch: Partial<ItemState>) {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const hasKitGlobal = temMPC &&
    (produtos[currentIndex]?.componentes ?? []).some(
      c => TAPETE_TYPES.has(c.componente?.tipo_calculo ?? '')
    )

  // Cálculos ao vivo
  const receitaBruta = Object.values(items).reduce((sum, i) => sum + i.qtd * i.valor, 0)
  const custoTotal   = Object.values(items).reduce((sum, i) => sum + i.qtd * i.custo, 0)
  const margem       = receitaBruta > 0 ? ((receitaBruta - custoTotal) / receitaBruta) * 100 : 0

  // Determina séries e num_alunos local pelo nome do produto
  function getLocalContext(prodNome: string) {
    const nome = prodNome.toLowerCase()
    const isMPC      = nome.includes('primeiro')
    const isCoding   = nome.includes('coding')
    const isCriaCode = nome.includes('cria')
    const isEdtechIA = nome.includes('intelig')

    const MPC_SERIES    = ['PreI', 'PreII', 'Ano1', 'Ano2', 'Ano3']
    const CODING_SERIES = [...(isCoding && !produtos.some(p => (p.produto?.nome ?? '').toLowerCase().includes('primeiro')) ? ['Ano3'] : []),
                           'Ano4', 'Ano5', 'Ano6', 'Ano7', 'Ano8', 'Ano9']
    const CRIA_SERIES   = ['Ano1', 'Ano2', 'Ano3', 'Ano4', 'Ano5']

    const seriesKeys = isMPC ? MPC_SERIES : isCoding ? CODING_SERIES : isCriaCode ? CRIA_SERIES : null
    const localTemas = seriesKeys
      ? Object.fromEntries(seriesKeys.map(k => [k, temasPorSerie[k] ?? 0]))
      : temasPorSerie
    const localAlunos = seriesKeys
      ? Object.fromEntries(seriesKeys.map(k => [k, alunosPorSerie[k] ?? 0]))
      : alunosPorSerie
    const localNumAlunos = isCriaCode
      ? CRIA_SERIES.reduce((sum, k) => sum + (alunosPorSerie[k] ?? 0), 0)
      : isEdtechIA
      ? numAlunosEdtechIA
      : numAlunos

    return { localTemas, localAlunos, localNumAlunos }
  }

  // Hint de quantidade por tipo de cálculo
  function getHint(tipoCalculo: string, prodNome = ''): { text: string; type: 'info' | 'warn' } | null {
    const { localTemas, localAlunos, localNumAlunos } = getLocalContext(prodNome)

    if (TAPETE_TYPES.has(tipoCalculo)) {
      const seriesSplit = (seriesTapetesState ?? '').split(',').filter(Boolean)
      const key = TAPETE_KEYS[tipoCalculo]
      const enabled = seriesTapetesState === null || seriesSplit.includes(key)
      const mult = TAPETE_MULT[tipoCalculo]
      if (!enabled) return { text: 'Série não incluída — qtd = 0', type: 'info' }
      if (numKitsState > 0) {
        const qty = mult * numKitsState
        return { text: `${mult} × ${numKitsState} kits = ${qty.toLocaleString('pt-BR')}`, type: 'info' }
      }
      return { text: 'Preencha Kits no Público para calcular', type: 'warn' }
    }
    if (tipoCalculo === 'PorProfessorXTema') {
      if (numProfessores === 0)
        return { text: 'Qtd estimada — preencha Professores e Temas no Público', type: 'warn' }
      const ALL_HINT_SERIES = [
        { key: 'PreI',  label: 'Pré I'  },
        { key: 'PreII', label: 'Pré II' },
        { key: 'Ano1',  label: '1º ano' },
        { key: 'Ano2',  label: '2º ano' },
        { key: 'Ano3',  label: '3º ano' },
        { key: 'Ano4',  label: '4º ano' },
        { key: 'Ano5',  label: '5º ano' },
        { key: 'Ano6',  label: '6º ano' },
        { key: 'Ano7',  label: '7º ano' },
        { key: 'Ano8',  label: '8º ano' },
        { key: 'Ano9',  label: '9º ano' },
      ]
      const linhas = ALL_HINT_SERIES
        .map(s => ({ ...s, t: localTemas[s.key] ?? 0, a: localAlunos[s.key] ?? 0 }))
        .filter(s => s.t > 0 && s.a > 0)
      if (linhas.length > 0) {
        const total = linhas.reduce((sum, s) => sum + numProfessores * s.t, 0) * numLivrosGuia
        const partes = linhas.map(s => `${s.label}: ${numProfessores} × ${s.t} = ${numProfessores * s.t}`).join(' | ')
        return { text: `${partes} | Total: ${total.toLocaleString('pt-BR')}`, type: 'info' }
      }
      if (numTemas > 0) {
        const total = numProfessores * numTemas * numLivrosGuia
        return { text: `${numProfessores} prof × ${numTemas} temas × ${numLivrosGuia} vol = ${total.toLocaleString('pt-BR')}`, type: 'info' }
      }
      return { text: 'Qtd estimada — preencha Professores e Temas no Público', type: 'warn' }
    }
    if (tipoCalculo === 'PorProfessor' && numProfessores > 0)
      return { text: `Sugestão: qtd = nº de professores (${numProfessores})`, type: 'info' }
    if (tipoCalculo === 'PorAluno' && localNumAlunos > 0)
      return { text: `Sugestão: qtd = nº de alunos (${localNumAlunos.toLocaleString('pt-BR')})`, type: 'info' }
    if (tipoCalculo === 'PorEscola' && numEscolas > 0)
      return { text: `Sugestão: qtd = nº de escolas (${numEscolas})`, type: 'info' }
    if (tipoCalculo === 'PorAlunoXTema') {
      const ALL_HINT_SERIES = [
        { key: 'PreI',  label: 'Pré I'    },
        { key: 'PreII', label: 'Pré II'   },
        { key: 'Ano1',  label: '1º ano'   },
        { key: 'Ano2',  label: '2º ano'   },
        { key: 'Ano3',  label: '3º ano'   },
        { key: 'Ano4',  label: '4º ano'   },
        { key: 'Ano5',  label: '5º ano'   },
        { key: 'Ano6',  label: '6º ano'   },
        { key: 'Ano7',  label: '7º ano'   },
        { key: 'Ano8',  label: '8º ano'   },
        { key: 'Ano9',  label: '9º ano'   },
      ]
      const linhas = ALL_HINT_SERIES
        .map(s => ({ ...s, a: localAlunos[s.key] ?? 0, t: localTemas[s.key] ?? 0 }))
        .filter(s => s.a > 0 && s.t > 0)
      if (linhas.length === 0)
        return { text: 'Qtd estimada — preencha Alunos e Temas no Público', type: 'warn' }
      const total = linhas.reduce((sum, s) => sum + s.a * s.t, 0)
      const partes = linhas.map(s => `${s.label}: ${s.a} × ${s.t} = ${s.a * s.t}`).join(' | ')
      return { text: `${partes} | Total: ${total.toLocaleString('pt-BR')}`, type: 'info' }
    }
    if (tipoCalculo === 'PorAlunoEProfessorXTema' && (localNumAlunos > 0 || numProfessores > 0) && numTemas > 0)
      return { text: `${(localNumAlunos * numTemas).toLocaleString('pt-BR')} para Alunos + ${(numProfessores * numTemas).toLocaleString('pt-BR')} para Professores`, type: 'info' }
    if (tipoCalculo === 'PorProfessor' && numProfessores === 0)
      return { text: `Qtd estimada — preencha Professores no Público`, type: 'warn' }
    if (tipoCalculo === 'PorAluno' && localNumAlunos === 0)
      return { text: `Qtd estimada — preencha Alunos no Público`, type: 'warn' }
    if (tipoCalculo === 'PorEscola' && numEscolas === 0)
      return { text: `Qtd estimada — preencha Escolas no Público`, type: 'warn' }
    if (tipoCalculo === 'PorAlunoEProfessorXTema' && (localNumAlunos === 0 || numTemas === 0))
      return { text: `Qtd estimada — preencha Alunos, Professores e Temas no Público`, type: 'warn' }
    if (tipoCalculo === 'PorEscolaXKit' && numEscolas > 0 && numKitsState > 0)
      return { text: `${numEscolas} escolas × ${numKitsState} kits = ${numEscolas * numKitsState}`, type: 'info' }
    if (tipoCalculo === 'PorEscolaXKit' && (numEscolas === 0 || numKitsState === 0))
      return { text: `Qtd estimada — preencha Escolas e Kits no Público`, type: 'warn' }
    return null
  }

  function handleDragEndComponentes(produtoPropId: string, allComps: Componente[], event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentIds = componenteOrdens[produtoPropId] ?? allComps.map(c => c.componente!.id)
    const oldIndex = currentIds.indexOf(active.id as string)
    const newIndex = currentIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newIds = arrayMove(currentIds, oldIndex, newIndex)
    setComponenteOrdens(prev => ({ ...prev, [produtoPropId]: newIds }))

    startReorderTransition(async () => {
      await reordenarCatalogo(
        newIds.map((id, i) => ({ id, ordem: i + 1 })),
        'componentes'
      )
    })
  }

  function handleDragEndServicos(produtoPropId: string, allServs: Servico[], event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentIds = servicoOrdens[produtoPropId] ?? allServs.map(s => s.servico!.id)
    const oldIndex = currentIds.indexOf(active.id as string)
    const newIndex = currentIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newIds = arrayMove(currentIds, oldIndex, newIndex)
    setServicoOrdens(prev => ({ ...prev, [produtoPropId]: newIds }))

    startReorderTransition(async () => {
      await reordenarCatalogo(
        newIds.map((id, i) => ({ id, ordem: i + 1 })),
        'servicos'
      )
    })
  }

  return (
    <div>
      <ResumoAoVivo
        receitaBruta={receitaBruta}
        custoTotal={custoTotal}
        margem={margem}
        limiteOrcamento={limiteOrcamento}
      />

      {hasKitGlobal && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-4">
          <span>Kits por escola:</span>
          <input
            type="number"
            min="1"
            value={kitsInput}
            onFocus={e => e.target.select()}
            onChange={e => {
              const raw = e.target.value
              setKitsInput(raw)
              const v = parseInt(raw, 10)
              if (!isNaN(v) && v >= 1) {
                setNumKitsState(v)
                const seriesSplit = (seriesTapetesState ?? '').split(',').filter(Boolean)
                for (const pp of produtos) {
                  for (const c of pp.componentes) {
                    const tc = c.componente?.tipo_calculo ?? ''
                    if (tc === 'PorEscolaXKit') {
                      updateItem(c.id, { qtd: numEscolas * v })
                    } else if (TAPETE_TYPES.has(tc)) {
                      const key = TAPETE_KEYS[tc]
                      if (seriesTapetesState === null || seriesSplit.includes(key)) {
                        updateItem(c.id, { qtd: TAPETE_MULT[tc] * v })
                      }
                    }
                  }
                }
              }
            }}
            onBlur={() => {
              const v = Math.max(1, parseInt(kitsInput, 10) || 1)
              setKitsInput(String(v))
              setNumKitsState(v)
              startKitsTransition(async () => { await atualizarNumKits(propostaId, v) })
            }}
            className="w-16 h-7 rounded border border-slate-300 text-sm text-center px-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <span className="text-slate-400 text-xs">— afeta todos os produtos com Kit</span>
        </div>
      )}

      {(() => {
        // Pre-compute valid products (those with at least one visible item)
        const seriesSplit = (seriesTapetesState ?? '').split(',').filter(Boolean)
        const produtosValidos = produtos
          .map(pp => {
            const visibleComponentes = pp.componentes.filter(c => {
              const tc = c.componente?.tipo_calculo ?? ''
              if (TAPETE_TYPES.has(tc)) {
                if (seriesTapetesState === null) return true
                return seriesSplit.includes(TAPETE_KEYS[tc])
              }
              return true
            })
            if (visibleComponentes.length === 0 && pp.servicos.length === 0) return null
            return { pp, visibleComponentes }
          })
          .filter((x): x is { pp: ProdutoProposta; visibleComponentes: Componente[] } => x !== null)

        if (produtosValidos.length === 0) return null

        const safeIndex = Math.min(currentIndex, produtosValidos.length - 1)
        const { pp, visibleComponentes } = produtosValidos[safeIndex]

        const countLivrosPAEPT = visibleComponentes.filter(
          c => c.componente?.tipo_calculo === 'PorAlunoEProfessorXTema'
        ).length

        const subtitleLivros = (() => {
          if (countLivrosPAEPT === 0 || numTemas === 0 || (numAlunos + numProfessores) === 0) return null
          const totAlun = numAlunos * numTemas * countLivrosPAEPT
          const totProf = numProfessores * numTemas * countLivrosPAEPT
          const total = totAlun + totProf
          const fmt = (n: number) => n.toLocaleString('pt-BR')
          return `${fmt(total)} livros (${fmt(totAlun)} alunos + ${fmt(totProf)} professores)`
        })()

        const compIds = componenteOrdens[pp.id]
        const orderedComps = compIds
          ? [...visibleComponentes].sort((a, b) => {
              const ai = compIds.indexOf(a.componente?.id ?? '')
              const bi = compIds.indexOf(b.componente?.id ?? '')
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
            })
          : visibleComponentes

        const servIds = servicoOrdens[pp.id]
        const orderedServicos = servIds
          ? [...pp.servicos].sort((a, b) => {
              const ai = servIds.indexOf(a.servico?.id ?? '')
              const bi = servIds.indexOf(b.servico?.id ?? '')
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
            })
          : pp.servicos

        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  {pp.produto?.nome}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {visibleComponentes.length + pp.servicos.length} itens
                  </Badge>
                </CardTitle>
                <span className="text-sm text-slate-400 flex-shrink-0">
                  {safeIndex + 1} / {produtosValidos.length}
                </span>
              </div>
              {subtitleLivros && (
                <p className="text-sm text-slate-500 mt-0.5">{subtitleLivros}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-slate-400 pb-2 gap-3">
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1">Item</span>
                <span className="w-20 text-center">Qtd</span>
                <span className="w-28 text-center">Venda unit.</span>
                <span className="w-24 text-right">Total venda</span>
                <span className="w-14 text-right">Margem</span>
              </div>

              {orderedComps.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Componentes</p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEndComponentes(pp.id, visibleComponentes, e)}
                  >
                    <SortableContext
                      items={orderedComps.map(c => c.componente?.id ?? c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedComps.map(c => {
                        const state = items[c.id] ?? { qtd: c.quantidade, valor: c.valor_venda_unit, custo: c.custo_interno_unit }
                        const tipoCalculo = c.componente?.tipo_calculo ?? ''
                        const sortableId = c.componente?.id ?? c.id
                        return (
                          <SortableItemRow
                            key={c.id}
                            sortableId={sortableId}
                            nome={c.componente?.nome ?? '—'}
                            categoria={c.componente?.categoria}
                            qtd={state.qtd}
                            valor={state.valor}
                            custo={state.custo}
                            hint={getHint(tipoCalculo, pp.produto?.nome ?? '')}
                            obrigatorio={c.obrigatorio}
                            onQtdChange={v => updateItem(c.id, { qtd: v })}
                            onValorChange={v => updateItem(c.id, { valor: v })}
                            onSave={() => atualizarComponente(c.id, propostaId, state.qtd, state.valor)}
                          />
                        )
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {orderedServicos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 mt-3">Serviços</p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleDragEndServicos(pp.id, pp.servicos, e)}
                  >
                    <SortableContext
                      items={orderedServicos.map(s => s.servico?.id ?? s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedServicos.map(s => {
                        const state = items[s.id] ?? { qtd: s.quantidade, valor: s.valor_venda_unit, custo: s.custo_interno_unit }
                        const tipoCalculo = s.servico?.tipo_calculo ?? ''
                        const sortableId = s.servico?.id ?? s.id
                        return (
                          <SortableItemRow
                            key={s.id}
                            sortableId={sortableId}
                            nome={s.servico?.nome ?? '—'}
                            qtd={state.qtd}
                            valor={state.valor}
                            custo={state.custo}
                            hint={getHint(tipoCalculo, pp.produto?.nome ?? '')}
                            onQtdChange={v => updateItem(s.id, { qtd: v })}
                            onValorChange={v => updateItem(s.id, { valor: v })}
                            onSave={() => atualizarServico(s.id, propostaId, state.qtd, state.valor)}
                          />
                        )
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Navigation footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <Button
                  variant="outline"
                  disabled={safeIndex === 0}
                  onClick={() => setCurrentIndex(i => i - 1)}
                >
                  ← Anterior
                </Button>

                <div className="flex gap-1">
                  {produtosValidos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === safeIndex ? 'bg-primary' : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {safeIndex < produtosValidos.length - 1 ? (
                  <Button onClick={() => setCurrentIndex(i => i + 1)}>
                    Próximo →
                  </Button>
                ) : (
                  <Button onClick={() => router.push(`/proposta/${propostaId}/descontos`)}>
                    Continuar →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })()}

    </div>
  )
}
