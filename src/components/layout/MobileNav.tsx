import React from 'react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/rutas', label: 'Rutas', icon: '🗺️' },
  { to: '/reportes', label: 'Más', icon: '☰' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive ? 'text-teal-700' : 'text-slate-400'
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
