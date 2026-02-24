'use client'

import { useState, useTransition } from 'react'
import { atualizarComponente, atualizarServico } from '@/lib/actions/proposta'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { Lock, Save, Loader2 } from 'lucide-react'

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

interface Props {
  propostaId: string
  propostaProdutoId: string
  componentes: Componente[]
  servicos: Servico[]
}

function ItemRow({
  id,
  nome,
  categoria,
  tipoCalculo,
  quantidade: qtdInicial,
  valorUnit: valorInicial,
  obrigatorio,
  onSave,
}: {
  id: string
  nome: string
  categoria?: string
  tipoCalculo: string
  quantidade: number
  valorUnit: number
  obrigatorio: boolean
  onSave: (id: string, qtd: number, valor: number) => Promise<void>
}) {
  const [qtd, setQtd] = useState(qtdInicial)
  const [valor, setValor] = useState(valorInicial)
  const [pending, startTransition] = useTransition()

  const total = qtd * valor

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
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
            value={qtd}
            onChange={e => setQtd(Number(e.target.value))}
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
            value={valor}
            onChange={e => setValor(Number(e.target.value))}
            className="h-8 text-sm text-right"
            title="Valor unitário"
          />
        </div>
        <span className="text-sm font-semibold text-slate-700 w-24 text-right">
          {formatCurrency(total)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-slate-400 hover:text-primary"
          onClick={() => startTransition(() => onSave(id, qtd, valor))}
          disabled={pending}
          title="Salvar"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}

export function ComponentesCliente({ propostaId, propostaProdutoId, componentes, servicos }: Props) {
  async function salvarComponente(id: string, qtd: number, valor: number) {
    await atualizarComponente(id, propostaId, qtd, valor)
  }

  async function salvarServico(id: string, qtd: number, valor: number) {
    await atualizarServico(id, propostaId, qtd, valor)
  }

  if (componentes.length === 0 && servicos.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">Nenhum componente cadastrado para este produto.</p>
  }

  return (
    <div>
      <div className="flex items-center text-xs text-slate-400 pb-2 gap-3">
        <span className="flex-1">Item</span>
        <span className="w-20 text-center">Qtd</span>
        <span className="w-28 text-center">Valor unit.</span>
        <span className="w-24 text-right">Total</span>
        <span className="w-8" />
      </div>

      {componentes.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Componentes</p>
          {componentes.map(c => (
            <ItemRow
              key={c.id}
              id={c.id}
              nome={c.componente?.nome ?? '—'}
              categoria={c.componente?.categoria}
              tipoCalculo={c.componente?.tipo_calculo ?? ''}
              quantidade={c.quantidade}
              valorUnit={c.valor_venda_unit}
              obrigatorio={c.obrigatorio}
              onSave={salvarComponente}
            />
          ))}
        </div>
      )}

      {servicos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 mt-3">Serviços</p>
          {servicos.map(s => (
            <ItemRow
              key={s.id}
              id={s.id}
              nome={s.servico?.nome ?? '—'}
              tipoCalculo={s.servico?.tipo_calculo ?? ''}
              quantidade={s.quantidade}
              valorUnit={s.valor_venda_unit}
              obrigatorio={s.obrigatorio}
              onSave={salvarServico}
            />
          ))}
        </div>
      )}
    </div>
  )
}
