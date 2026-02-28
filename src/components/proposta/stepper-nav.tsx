'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/utils/cn'

const STEPS = [
  { id: 1, label: 'Orçamento', path: 'orcamento' },
  { id: 2, label: 'Público', path: 'publico' },
  { id: 3, label: 'Produtos', path: 'produtos' },
  { id: 4, label: 'Componentes', path: 'componentes' },
  { id: 5, label: 'Descontos', path: 'descontos' },
  { id: 6, label: 'Repasse', path: 'repasse' },
  { id: 7, label: 'Revisão', path: 'revisao' },
  { id: 8, label: 'Cliente', path: 'cliente' },
]

function getCurrentStep(pathname: string): number {
  if (pathname.includes('/nova')) return 1
  for (const step of STEPS) {
    if (pathname.endsWith(`/${step.path}`)) return step.id
  }
  return 1
}

export function StepperNav({
  propostaId,
  passoMaximo = 8,
}: {
  propostaId?: string
  passoMaximo?: number
}) {
  const pathname = usePathname()
  const current = getCurrentStep(pathname)

  return (
    <div className="w-full bg-white border-b border-slate-200">
      {/* Mobile: indicador compacto */}
      <div className="flex md:hidden items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                s.id === current ? 'w-4 bg-primary' :
                s.id < current ? 'w-1.5 bg-primary/50' :
                'w-1.5 bg-slate-200'
              )}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-slate-800">
          {STEPS.find(s => s.id === current)?.label}
        </span>
        <span className="ml-auto text-xs text-slate-400 tabular-nums">{current}/{STEPS.length}</span>
      </div>

      {/* Desktop: stepper completo */}
      <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto px-8 py-4">
        {STEPS.map((step, idx) => {
          const done = step.id < current
          const active = step.id === current
          const locked = step.id > passoMaximo

          const href = step.id === 1
            ? '/proposta/nova'
            : propostaId
            ? `/proposta/${propostaId}/${step.path}`
            : '#'

          const circle = locked ? (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200"
              title="Complete a etapa anterior primeiro"
            >
              <Lock className="w-3.5 h-3.5 text-slate-300" />
            </div>
          ) : done ? (
            <Link
              href={href}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/80 transition-colors"
            >
              <Check className="w-4 h-4" />
            </Link>
          ) : active ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
              {step.id}
            </div>
          ) : (
            <Link
              href={href}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-sm font-semibold hover:border-slate-300 transition-colors"
            >
              {step.id}
            </Link>
          )

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Linha conectora esquerda */}
              {idx > 0 && (
                <div className={cn(
                  'flex-1 h-0.5 mr-2',
                  done ? 'bg-primary' : 'bg-slate-200'
                )} />
              )}

              <div className="flex flex-col items-center gap-1">
                {circle}
                <span className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  active ? 'text-primary'
                    : done ? 'text-slate-600'
                    : locked ? 'text-slate-300'
                    : 'text-slate-400'
                )}>
                  {step.label}
                </span>
              </div>

              {/* Linha conectora direita */}
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 ml-2',
                  step.id < current ? 'bg-primary' : 'bg-slate-200'
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
