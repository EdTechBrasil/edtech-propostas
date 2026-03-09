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
import { NotificacoesBell } from './notificacoes-bell'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  perfis: string[]
  group?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',          icon: LayoutDashboard, perfis: ['Comercial', 'Gestor', 'ADM'] },
  { label: 'Propostas',     href: '/propostas',          icon: FileText,        perfis: ['Comercial', 'Gestor', 'ADM'] },
  { label: 'Nova Proposta', href: '/proposta/nova',      icon: FilePlus,        perfis: ['Comercial', 'Gestor', 'ADM'] },
  { label: 'Aprovações',   href: '/aprovacao',          icon: ShieldCheck,     perfis: ['Gestor', 'ADM'] },
  { label: 'Relatórios',   href: '/relatorios',         icon: BarChart3,       perfis: ['Gestor', 'ADM'] },
  { label: 'Usuários',     href: '/admin/usuarios',     icon: Users,           perfis: ['ADM'], group: 'Admin' },
  { label: 'Produtos',      href: '/admin/produtos',     icon: Package,         perfis: ['ADM'], group: 'Admin' },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings,       perfis: ['ADM'], group: 'Admin' },
]

function getIniciais(nome?: string | null) {
  if (!nome) return '?'
  return nome.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

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

  // Renderiza os itens agrupando com label de seção
  function renderItems() {
    const els: React.ReactNode[] = []
    let lastGroup: string | undefined = undefined

    itemsFiltrados.forEach((item) => {
      // Inserir label de grupo quando mudar
      if (!collapsed && item.group && item.group !== lastGroup) {
        els.push(
          <p key={`group-${item.group}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {item.group}
          </p>
        )
      }
      lastGroup = item.group

      const Icon = item.icon
      const ativo = pathname.startsWith(item.href)

      const linkEl = (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'relative flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
            ativo
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
          )}
        >
          {/* Indicador lateral ativo */}
          {ativo && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
          )}
          <Icon className={cn(
            'w-[18px] h-[18px] flex-shrink-0 transition-colors',
            ativo ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          )} />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      )

      if (collapsed) {
        els.push(
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      } else {
        els.push(linkEl)
      }
    })

    return els
  }

  const iniciais = getIniciais(usuario?.nome)

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-64'
      )}>
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 h-14 border-b border-slate-200 dark:border-slate-700 flex-shrink-0',
          collapsed ? 'px-0 justify-center' : 'px-5'
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary flex-shrink-0 shadow-sm">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">EdTech</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight font-medium">Propostas</p>
            </div>
          )}
          {onClose && !collapsed && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 py-3 overflow-y-auto', collapsed ? 'px-2 space-y-1' : 'px-3 space-y-0.5')}>
          {renderItems()}
        </nav>

        {/* Usuário */}
        <div className={cn(
          'border-t border-slate-200 dark:border-slate-700 flex-shrink-0',
          collapsed ? 'p-2' : 'p-3'
        )}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              {usuario?.id && <NotificacoesBell usuarioId={usuario.id} />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="p-2 rounded-lg w-full flex justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Sair"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              {/* Avatar */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{iniciais}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100 leading-tight">{usuario?.nome}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{usuario?.perfil}</p>
              </div>
              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {usuario?.id && <NotificacoesBell usuarioId={usuario.id} />}
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-[15px] h-[15px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
