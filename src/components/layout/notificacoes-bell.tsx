'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { marcarTodasLidas } from '@/lib/actions/notificacoes'
import { Bell } from 'lucide-react'
import Link from 'next/link'

type Notificacao = {
  id: string
  proposta_id: string | null
  tipo: string
  mensagem: string
  lida: boolean
  criado_em: string
}

export function NotificacoesBell({ usuarioId }: { usuarioId: string }) {
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchNotifs() {
      const { data } = await supabase
        .from('notificacoes')
        .select('id, proposta_id, tipo, mensagem, lida, criado_em')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .limit(20)
      setNotifs(data ?? [])
    }

    fetchNotifs()

    const channel = supabase
      .channel(`notif-${usuarioId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `usuario_id=eq.${usuarioId}` },
        (payload) => setNotifs(prev => [payload.new as Notificacao, ...prev].slice(0, 20))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificacoes', filter: `usuario_id=eq.${usuarioId}` },
        () => fetchNotifs()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [usuarioId])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifs.filter(n => !n.lida).length

  async function handleMarkAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
    await marcarTodasLidas()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-0 left-full ml-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificações</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
              {notifs.slice(0, 10).map(n => {
                const data = n.criado_em.slice(0, 10).split('-').reverse().join('/')
                const hora = n.criado_em.slice(11, 16)
                const inner = (
                  <div
                    className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!n.lida ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lida && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                      <div className={!n.lida ? '' : 'ml-3.5'}>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug">{n.mensagem}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{data} {hora}</p>
                      </div>
                    </div>
                  </div>
                )
                return n.proposta_id ? (
                  <Link key={n.id} href={`/historico/${n.proposta_id}`}>{inner}</Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
