import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ACTIONS = [
  { label: 'Nueva visita', to: '/visitas?nueva=1', icon: '📍' },
  { label: 'Nueva venta', to: '/ventas?nueva=1', icon: '🧾' },
  { label: 'Registrar pago', to: '/cobranzas?nueva=1', icon: '💵' },
  { label: 'Nuevo cliente', to: '/clientes?nueva=1', icon: '👤' },
  { label: 'Nuevo compromiso', to: '/compromisos?nueva=1', icon: '🤝' },
  { label: 'Nueva reserva', to: '/reservas?nueva=1', icon: '🏦' },
  { label: 'Nueva oportunidad', to: '/oportunidades?nueva=1', icon: '🎯' },
]

export function QuickAction() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-900/40" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-24 left-1/2 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  setOpen(false)
                  navigate(a.to)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-navy-800 hover:bg-slate-100"
              >
                <span className="text-xl">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white shadow-lg active:scale-95 sm:bottom-6"
        aria-label="Registrar"
      >
        {open ? '✕' : '＋'}
      </button>
    </>
  )
}
