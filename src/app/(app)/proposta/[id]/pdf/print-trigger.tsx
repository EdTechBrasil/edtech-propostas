'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

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
