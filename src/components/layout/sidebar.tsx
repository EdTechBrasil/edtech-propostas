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
  X,
  FileText,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { NotificacoesBell } from './notificacoes-bell'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    perfis: ['Comercial', 'Gestor', 'ADM'],
  },
  {
    label: 'Propostas',
    href: '/propostas',
    icon: FileText,
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

export function Sidebar({
  onClose,
  collapsed = false,
}: {
  onClose?: () => void
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const { usuario, signOut } = useAuth()

  const itemsFiltrados = navItems.filter(
    (item) => usuario && item.perfis.includes(usuario.perfil)
  )

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200',
        collapsed ? 'w-20' : 'w-64'
      )}>
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 py-5 border-b border-slate-200 dark:border-slate-700',
          collapsed ? 'px-0 justify-center' : 'px-6'
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">EdTech</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Propostas</p>
            </div>
          )}
          {onClose && !collapsed && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 py-4 space-y-1', collapsed ? 'px-2' : 'px-3')}>
          {itemsFiltrados.map((item) => {
            const Icon = item.icon
            const ativo = pathname.startsWith(item.href)
            const linkEl = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                  ativo
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', ativo ? 'text-indigo-600' : '')} />
                {!collapsed && item.label}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return linkEl
          })}
        </nav>

        {/* Usuário */}
        <div className={cn('py-4 border-t border-slate-200 dark:border-slate-700', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">{usuario?.nome}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{usuario?.perfil}</p>
              </div>
              {usuario?.id && <NotificacoesBell usuarioId={usuario.id} />}
            </div>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
