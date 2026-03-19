'use client'

import { useState, useTransition } from 'react'
import { adicionarComentario } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

type Comentario = {
  id: string
  texto: string
  criado_em: string
  autor: { nome: string } | null
}

export function Comentarios({
  propostaId,
  comentariosIniciais,
}: {
  propostaId: string
  comentariosIniciais: Comentario[]
}) {
  const [comentarios, setComentarios] = useState<Comentario[]>(comentariosIniciais)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setErro('')
    startTransition(async () => {
      const result = await adicionarComentario(propostaId, texto.trim())
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao comentar')
      } else if ('comentario' in result) {
        setComentarios(prev => [...prev, result.comentario as Comentario])
        setTexto('')
      }
    })
  }

  return (
    <div className="mt-10 pt-8 border-t border-slate-200">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">
        Comentários {comentarios.length > 0 && <span className="text-slate-400 font-normal">({comentarios.length})</span>}
      </h2>

      {comentarios.length > 0 && (
        <div className="space-y-3 mb-5">
          {comentarios.map(c => (
            <div key={c.id} className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-700">{c.autor?.nome ?? '—'}</p>
                <p className="text-xs text-slate-400">
                  {c.criado_em.slice(0, 10).split('-').reverse().join('/')} {c.criado_em.slice(11, 16)}
                </p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{c.texto}</p>
            </div>
          ))}
        </div>
      )}

      {comentarios.length === 0 && (
        <p className="text-sm text-slate-400 italic mb-4">Nenhum comentário ainda.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <label htmlFor="comentario-texto" className="sr-only">Adicionar comentário</label>
        <textarea
          id="comentario-texto"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Adicionar um comentário..."
          rows={2}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !texto.trim()}
          className="gap-1.5 self-end"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar
        </Button>
      </form>
      {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
    </div>
  )
}
