'use client'

import { useState } from 'react'
import { Menu, BookOpen, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Sidebar } from './sidebar'
import { cn } from '@/utils/cn'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-screen">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer no mobile, fixo no desktop */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 md:sticky md:top-0 md:h-screen md:flex md:flex-col transition-all duration-200',
        sidebarOpen ? 'flex' : 'hidden md:flex'
      )}>
        <Sidebar onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      </div>

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header persistente */}
        <header className="flex items-center gap-3 px-4 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
          {/* Mobile: abre drawer */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Mobile: logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">EdTech Propostas</span>
          </div>
          {/* Desktop: botão colapsar sidebar */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex-1" />
          {/* Toggle dark/light */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
