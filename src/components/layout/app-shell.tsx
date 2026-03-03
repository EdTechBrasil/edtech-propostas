'use client'

import { useState } from 'react'
import { Menu, BookOpen } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/utils/cn'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer no mobile, fixo no desktop */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:flex md:flex-col',
        sidebarOpen ? 'flex' : 'hidden md:flex'
      )}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">EdTech Propostas</span>
          </div>
        </header>

        <main className="flex-1 bg-slate-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
