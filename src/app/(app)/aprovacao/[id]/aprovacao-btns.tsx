'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { aprovarExcecao, rejeitarExcecao } from '@/lib/actions/aprovacao'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function AprovacaoBtns({ propostaId }: { propostaId: string }) {
  const [openAprovar, setOpenAprovar] = useState(false)
  const [openRejeitar, setOpenRejeitar] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const router = useRouter()

  function handleAprovar(formData: FormData) {
    const observacao = formData.get('observacao') as string
    setErro('')
    startTransition(async () => {
      const result = await aprovarExcecao(propostaId, observacao || undefined)
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao aprovar')
      } else {
        router.push('/aprovacao')
      }
    })
  }

  function handleRejeitar(formData: FormData) {
    const motivo = formData.get('motivo') as string
    setErro('')
    startTransition(async () => {
      const result = await rejeitarExcecao(propostaId, motivo)
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao rejeitar')
      } else {
        setOpenRejeitar(false)
        router.push('/aprovacao')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{erro}</p>
      )}

      {/* Aprovar */}
      <Dialog open={openAprovar} onOpenChange={setOpenAprovar}>
        <DialogTrigger asChild>
          <Button
            disabled={isPending}
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprovar exceção
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar exceção de margem</DialogTitle>
            <DialogDescription>
              A proposta avançará para o status <strong>Aprovada</strong> e o Comercial poderá gerar o PDF.
            </DialogDescription>
          </DialogHeader>
          <form action={handleAprovar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <textarea
                id="observacao"
                name="observacao"
                rows={3}
                placeholder="Deixe uma nota para o Comercial..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAprovar(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar aprovação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejeitar */}
      <Dialog open={openRejeitar} onOpenChange={setOpenRejeitar}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            <XCircle className="w-4 h-4" />
            Rejeitar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
            <DialogDescription>
              A proposta voltará para <strong>Rascunho</strong> e o Comercial poderá revisá-la e solicitar aprovação novamente.
            </DialogDescription>
          </DialogHeader>
          <form action={handleRejeitar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <textarea
                id="motivo"
                name="motivo"
                rows={3}
                placeholder="Informe o motivo da rejeição para o Comercial..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenRejeitar(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                variant="destructive"
                className="gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar rejeição
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
