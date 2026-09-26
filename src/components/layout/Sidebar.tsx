import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const BASE_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/oportunidades', label: 'Oportunidades', icon: '🎯' },
  { to: '/rutas', label: 'Rutas', icon: '🗺️' },
  { to: '/visitas', label: 'Visitas', icon: '📍' },
  { to: '/ventas', label: 'Ventas', icon: '🧾' },
  { to: '/cobranzas', label: 'Cobranzas', icon: '💵' },
  { to: '/cuentas-por-cobrar', label: 'Cuentas por cobrar', icon: '📒' },
  { to: '/compromisos', label: 'Compromisos', icon: '🤝' },
  { to: '/reservas', label: 'Reservas', icon: '🏦' },
  { to: '/productos', label: 'Productos', icon: '📦' },
  { to: '/reportes', label: 'Reportes', icon: '📊' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-navy-900 text-slate-100 sm:flex">
      <div className="px-5 py-6">
        <p className="text-lg font-extrabold tracking-tight">CRM Campo</p>
        <p className="text-xs text-slate-400">{profile?.full_name} · {profile?.role}</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {BASE_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-navy-700'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-navy-700'
              }`
            }
          >
            <span>⚙️</span>
            Administración
          </NavLink>
        )}
      </nav>
      <button onClick={signOut} className="m-3 rounded-lg border border-navy-700 px-3 py-2 text-left text-sm text-slate-300 hover:bg-navy-700">
        Cerrar sesión
      </button>
    </aside>
  )
}
