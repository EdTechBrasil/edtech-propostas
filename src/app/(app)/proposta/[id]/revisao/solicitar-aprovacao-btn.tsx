'use client'

import { useTransition } from 'react'
import { solicitarAprovacao } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldAlert } from 'lucide-react'

export function SolicitarAprovacaoBtn({ propostaId, margemCalculada }: { propostaId: string; margemCalculada: number }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await solicitarAprovacao(propostaId, margemCalculada)
    })
  }

  return (
    <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
      Solicitar aprovação de exceção
    </Button>
  )
}
