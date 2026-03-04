'use client'

import { useState, useTransition } from 'react'
import { atualizarComponente, atualizarServico } from '@/lib/actions/proposta'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import { Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Componente {
  id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  componente: { nome: string; categoria: string; tipo_calculo: string } | null
}

interface Servico {
  id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  servico: { nome: string; tipo_calculo: string } | null
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
  numEscolas: number
  numTemas: number
  numKits: number
  produtos: ProdutoProposta[]
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  nome,
  categoria,
  tipoCalculo,
  qtd,
  valor,
  custo,
  obrigatorio,
  hint,
  onQtdChange,
  onValorChange,
  onSave,
}: {
  nome: string
  categoria?: string
  tipoCalculo: string
  qtd: number
  valor: number
  custo: number
  obrigatorio: boolean
  hint: { text: string; type: 'info' | 'warn' } | null
  onQtdChange: (v: number) => void
  onValorChange: (v: number) => void
  onSave: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [qtdFocused, setQtdFocused] = useState(false)
  const [valorFocused, setValorFocused] = useState(false)
  const total = qtd * valor
  const margemItem = valor > 0 ? ((valor - custo) / valor) * 100 : null
  const margemCor =
    margemItem === null ? 'text-slate-400' :
    margemItem >= 20    ? 'text-green-600' :
    margemItem >= 12    ? 'text-amber-500' :
    'text-red-500'

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-800 truncate">{nome}</span>
            {categoria && <Badge variant="outline" className="text-xs">{categoria}</Badge>}
            <Badge variant="secondary" className="text-xs">{tipoCalculo}</Badge>
            {obrigatorio && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock className="w-3 h-3" /> Obrigatório
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-20">
            <Input
              type="number"
              min="0"
              step="1"
              value={qtdFocused && qtd === 0 ? '' : qtd}
              onChange={e => onQtdChange(e.target.value === '' ? 0 : Number(e.target.value))}
              onFocus={e => { setQtdFocused(true); e.target.select() }}
              onBlur={() => { setQtdFocused(false); startTransition(onSave) }}
              className="h-8 text-sm text-center"
              title="Quantidade"
            />
          </div>
          <span className="text-slate-400 text-sm">×</span>
          <div className="w-28">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valorFocused && valor === 0 ? '' : valor}
              onChange={e => onValorChange(e.target.value === '' ? 0 : Number(e.target.value))}
              onFocus={e => { setValorFocused(true); e.target.select() }}
              onBlur={() => { setValorFocused(false); startTransition(onSave) }}
              className="h-8 text-sm text-right"
              title="Valor venda unitário"
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 w-24 text-right" title="Total venda">
            {formatCurrency(total)}
          </span>
          <span className="text-sm text-slate-500 w-24 text-right" title="Custo unitário">
            {formatCurrency(custo)}
          </span>
          <span className={`text-sm font-medium w-14 text-right ${margemCor}`} title="Margem por item">
            {margemItem !== null ? `${margemItem.toFixed(1)}%` : ''}
          </span>
        </div>
      </div>

      {hint && (
        <p className={`text-xs mt-1 ${hint.type === 'warn' ? 'text-amber-600' : 'text-blue-500'}`}>
          {hint.text}
        </p>
      )}
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
  numEscolas,
  numTemas,
  numKits,
  produtos,
}: Props) {
  // Estado global: todos os items (componentes + serviços) de todos os produtos
  const [items, setItems] = useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    for (const pp of produtos) {
      for (const c of pp.componentes) {
        initial[c.id] = { qtd: c.quantidade, valor: c.valor_venda_unit, custo: c.custo_interno_unit }
      }
      for (const s of pp.servicos) {
        initial[s.id] = { qtd: s.quantidade, valor: s.valor_venda_unit, custo: s.custo_interno_unit }
      }
    }
    return initial
  })

  function updateItem(id: string, patch: Partial<ItemState>) {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  // Cálculos ao vivo
  const receitaBruta = Object.values(items).reduce((sum, i) => sum + i.qtd * i.valor, 0)
  const custoTotal   = Object.values(items).reduce((sum, i) => sum + i.qtd * i.custo, 0)
  const margem       = receitaBruta > 0 ? ((receitaBruta - custoTotal) / receitaBruta) * 100 : 0

  // Hint de quantidade por tipo de cálculo
  function getHint(tipoCalculo: string): { text: string; type: 'info' | 'warn' } | null {
    if (tipoCalculo === 'PorProfessor' && numProfessores > 0)
      return { text: `Sugestão: qtd = nº de professores (${numProfessores})`, type: 'info' }
    if (tipoCalculo === 'PorAluno' && numAlunos > 0)
      return { text: `Sugestão: qtd = nº de alunos (${numAlunos})`, type: 'info' }
    if (tipoCalculo === 'PorEscola' && numEscolas > 0)
      return { text: `Sugestão: qtd = nº de escolas (${numEscolas})`, type: 'info' }
    if (tipoCalculo === 'PorAlunoXTema' && numAlunos > 0 && numTemas > 0)
      return { text: `Sugestão: qtd = alunos × temas (${numAlunos} × ${numTemas} = ${numAlunos * numTemas})`, type: 'info' }
    if (tipoCalculo === 'PorAlunoEProfessorXTema' && (numAlunos > 0 || numProfessores > 0) && numTemas > 0)
      return { text: `${(numAlunos * numTemas).toLocaleString('pt-BR')} para Alunos + ${(numProfessores * numTemas).toLocaleString('pt-BR')} para Professores`, type: 'info' }
    if (tipoCalculo === 'PorProfessor' && numProfessores === 0)
      return { text: `Qtd estimada — preencha Professores no Público`, type: 'warn' }
    if (tipoCalculo === 'PorAluno' && numAlunos === 0)
      return { text: `Qtd estimada — preencha Alunos no Público`, type: 'warn' }
    if (tipoCalculo === 'PorEscola' && numEscolas === 0)
      return { text: `Qtd estimada — preencha Escolas no Público`, type: 'warn' }
    if (tipoCalculo === 'PorAlunoXTema' && (numAlunos === 0 || numTemas === 0))
      return { text: `Qtd estimada — preencha Alunos e Temas no Público`, type: 'warn' }
    if (tipoCalculo === 'PorAlunoEProfessorXTema' && (numAlunos === 0 || numTemas === 0))
      return { text: `Qtd estimada — preencha Alunos, Professores e Temas no Público`, type: 'warn' }
    if (tipoCalculo === 'PorEscolaXKit' && numEscolas > 0 && numKits > 0)
      return { text: `${numEscolas} escolas × ${numKits} kits = ${numEscolas * numKits}`, type: 'info' }
    if (tipoCalculo === 'PorEscolaXKit' && (numEscolas === 0 || numKits === 0))
      return { text: `Qtd estimada — preencha Escolas e Kits no Público`, type: 'warn' }
    return null
  }

  return (
    <div>
      <ResumoAoVivo
        receitaBruta={receitaBruta}
        custoTotal={custoTotal}
        margem={margem}
        limiteOrcamento={limiteOrcamento}
      />

      <div className="space-y-6">
        {produtos.map(pp => {
          const visibleComponentes = pp.componentes.filter(
            c => c.componente?.tipo_calculo !== 'PorProfessorXTema'
          )
          if (visibleComponentes.length === 0 && pp.servicos.length === 0) return null

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

          return (
            <Card key={pp.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {pp.produto?.nome}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {visibleComponentes.length + pp.servicos.length} itens
                  </Badge>
                </CardTitle>
                {subtitleLivros && (
                  <p className="text-sm text-slate-500 mt-0.5">{subtitleLivros}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-slate-400 pb-2 gap-3">
                  <span className="flex-1">Item</span>
                  <span className="w-20 text-center">Qtd</span>
                  <span className="w-28 text-center">Venda unit.</span>
                  <span className="w-24 text-right">Total venda</span>
                  <span className="w-24 text-right">Custo unit.</span>
                  <span className="w-14 text-right">Margem</span>
                </div>

                {visibleComponentes.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Componentes</p>
                    {visibleComponentes.map(c => {
                      const state = items[c.id] ?? { qtd: c.quantidade, valor: c.valor_venda_unit, custo: c.custo_interno_unit }
                      const tipoCalculo = c.componente?.tipo_calculo ?? ''
                      return (
                        <ItemRow
                          key={c.id}
                          nome={c.componente?.nome ?? '—'}
                          categoria={c.componente?.categoria}
                          tipoCalculo={tipoCalculo}
                          qtd={state.qtd}
                          valor={state.valor}
                          custo={state.custo}
                          obrigatorio={c.obrigatorio}
                          hint={getHint(tipoCalculo)}
                          onQtdChange={v => updateItem(c.id, { qtd: v })}
                          onValorChange={v => updateItem(c.id, { valor: v })}
                          onSave={() => atualizarComponente(c.id, propostaId, state.qtd, state.valor)}
                        />
                      )
                    })}
                  </div>
                )}

                {pp.servicos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 mt-3">Serviços</p>
                    {pp.servicos.map(s => {
                      const state = items[s.id] ?? { qtd: s.quantidade, valor: s.valor_venda_unit, custo: s.custo_interno_unit }
                      const tipoCalculo = s.servico?.tipo_calculo ?? ''
                      return (
                        <ItemRow
                          key={s.id}
                          nome={s.servico?.nome ?? '—'}
                          tipoCalculo={tipoCalculo}
                          qtd={state.qtd}
                          valor={state.valor}
                          custo={state.custo}
                          obrigatorio={s.obrigatorio}
                          hint={getHint(tipoCalculo)}
                          onQtdChange={v => updateItem(s.id, { qtd: v })}
                          onValorChange={v => updateItem(s.id, { valor: v })}
                          onSave={() => atualizarServico(s.id, propostaId, state.qtd, state.valor)}
                        />
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
