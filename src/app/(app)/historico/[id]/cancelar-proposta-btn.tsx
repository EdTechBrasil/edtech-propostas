'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cancelarProposta, duplicarProposta } from '@/lib/actions/proposta'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { XCircle, Copy, Loader2 } from 'lucide-react'

export function CancelarPropostaBtn({ propostaId }: { propostaId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const router = useRouter()

  function handleCancelar() {
    setErro('')
    startTransition(async () => {
      const result = await cancelarProposta(propostaId)
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao cancelar')
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancelar proposta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar proposta</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A proposta ficará com status <strong>Cancelada</strong>.
          </DialogDescription>
        </DialogHeader>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
          <Button
            variant="destructive"
            onClick={handleCancelar}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DuplicarPropostaBtn({ propostaId }: { propostaId: string }) {
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const router = useRouter()

  function handleDuplicar() {
    setErro('')
    startTransition(async () => {
      const result = await duplicarProposta(propostaId)
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao duplicar')
      } else if ('novaPropostaId' in result) {
        router.push(`/proposta/${result.novaPropostaId}/publico`)
      }
    })
  }

  return (
    <div>
      {erro && <p className="text-xs text-red-600 mb-1">{erro}</p>}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicar}
        disabled={isPending}
        className="gap-1.5"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
        Duplicar
      </Button>
    </div>
  )
}
