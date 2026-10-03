import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { QuickAction } from './QuickAction'
import { useAuth } from '../../contexts/AuthContext'

export function AppLayout() {
  const { signOut, profile } = useAuth()
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden"
          style={{ paddingTop: 'calc(var(--sat) + 0.75rem)' }}>
          <p className="font-extrabold text-navy-900">CRM Campo</p>
          <button onClick={signOut} className="text-sm text-slate-500">{profile?.full_name?.split(' ')[0]} · Salir</button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-5 pb-[calc(6rem+var(--sab))] sm:pb-10">
          <Outlet />
        </main>
      </div>
      <QuickAction />
      <MobileNav />
    </div>
  )
}
