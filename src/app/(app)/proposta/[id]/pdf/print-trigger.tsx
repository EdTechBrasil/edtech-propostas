'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'

export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [])
  return null
}

export function PrintButton() {
  return (
    <Button size="sm" className="gap-2" onClick={() => window.print()}>
      <Printer className="w-4 h-4" />
      Imprimir / Salvar PDF
    </Button>
  )
}

export function PrintLink() {
  return (
    <button
      onClick={() => window.print()}
      className="text-blue-600 underline cursor-pointer"
    >
      clique aqui
    </button>
  )
}

export function PrintTriggerManual() {
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    function onReady() { setPronto(true) }
    document.addEventListener('pdf-template-ready', onReady)
    return () => document.removeEventListener('pdf-template-ready', onReady)
  }, [])

  if (!pronto) {
    return (
      <span className="text-sm text-slate-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando template…
      </span>
    )
  }

  return (
    <Button size="sm" className="gap-2" onClick={() => window.print()}>
      <Printer className="w-4 h-4" />
      Imprimir / Salvar PDF
    </Button>
  )
}
