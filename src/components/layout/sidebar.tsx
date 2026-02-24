'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Settings,
  LogOut,
  BookOpen,
  ShieldCheck,
  Package,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { NotificacoesBell } from './notificacoes-bell'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    perfis: ['Comercial', 'Gestor', 'ADM'],
  },
  {
    label: 'Nova Proposta',
    href: '/proposta/nova',
    icon: FilePlus,
    perfis: ['Comercial', 'Gestor', 'ADM'],
  },
  {
    label: 'Aprovações',
    href: '/aprovacao',
    icon: ShieldCheck,
    perfis: ['Gestor', 'ADM'],
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    perfis: ['Gestor', 'ADM'],
  },
  {
    label: 'Usuários',
    href: '/admin/usuarios',
    icon: Users,
    perfis: ['ADM'],
  },
  {
    label: 'Produtos',
    href: '/admin/produtos',
    icon: Package,
    perfis: ['ADM'],
  },
  {
    label: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
    perfis: ['ADM'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuario, signOut } = useAuth()

  const itemsFiltrados = navItems.filter(
    (item) => usuario && item.perfis.includes(usuario.perfil)
  )

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">EdTech</p>
          <p className="text-xs text-slate-400 leading-tight">Propostas</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {itemsFiltrados.map((item) => {
          const Icon = item.icon
          const ativo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                ativo
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuário */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nome}</p>
            <p className="text-xs text-slate-400">{usuario?.perfil}</p>
          </div>
          {usuario?.id && <NotificacoesBell usuarioId={usuario.id} />}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
