'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

const TIPOS = [
  { value: 'Nenhum', label: 'Nenhum repasse', desc: 'Sem repasse ao parceiro' },
  { value: 'Fixo', label: 'Fixo (R$)', desc: 'Valor fixo em reais' },
  { value: 'Percentual', label: 'Percentual (%)', desc: 'Percentual sobre a receita líquida' },
]

export function RepasseCliente({ tipoInicial, valorInicial, receitaBruta }: { tipoInicial: string; valorInicial: number; receitaBruta: number }) {
  const [tipo, setTipo] = useState(tipoInicial || 'Nenhum')

  return (
    <div className="space-y-4">
      {/* Seletor de tipo */}
      <div className="grid grid-cols-3 gap-3">
        {TIPOS.map(t => (
          <label
            key={t.value}
            className={cn(
              'flex flex-col gap-1 rounded-lg border p-4 cursor-pointer transition-colors',
              tipo === t.value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            )}
          >
            <input
              type="radio"
              name="repasse_tipo"
              value={t.value}
              checked={tipo === t.value}
              onChange={() => setTipo(t.value)}
              className="sr-only"
            />
            <span className="font-medium text-sm">{t.label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</span>
          </label>
        ))}
      </div>

      {/* Campo de valor */}
      {tipo !== 'Nenhum' && (
        <div className="space-y-2">
          <Label htmlFor="repasse_valor">
            {tipo === 'Fixo' ? 'Valor do repasse (R$)' : 'Percentual do repasse (%)'}
          </Label>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-slate-400">{tipo === 'Fixo' ? 'R$' : ''}</span>
            <Input
              id="repasse_valor"
              name="repasse_valor"
              type="number"
              min="0"
              max={tipo === 'Percentual' ? 100 : receitaBruta > 0 ? receitaBruta : undefined}
              step={tipo === 'Fixo' ? '0.01' : '0.1'}
              defaultValue={valorInicial}
              className="text-right"
            />
            <span className="text-slate-400">{tipo === 'Percentual' ? '%' : ''}</span>
          </div>
        </div>
      )}

      {/* Hidden field para quando tipo = Nenhum */}
      {tipo === 'Nenhum' && (
        <input type="hidden" name="repasse_valor" value="0" />
      )}
    </div>
  )
}
