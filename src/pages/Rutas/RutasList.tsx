import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatDate, todayISO } from '../../lib/format'
import type { RouteRow } from '../../types'

export default function RutasList() {
  const { profile } = useAuth()
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('routes').select('*').order('route_date', { ascending: false })
    setRoutes((data as RouteRow[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('routes').insert({
      name, route_date: date, assigned_to: profile?.id, status: 'planificada',
    }).select().single()
    setSaving(false)
    setOpen(false)
    setName('')
    load()
    if (data) window.location.href = `/rutas/${data.id}`
  }

  return (
    <div>
      <PageHeader
        title="Rutas"
        subtitle="Rutas comerciales y de cobranza"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nueva ruta</button>}
      />
      {routes.length === 0 ? (
        <EmptyState title="No hay rutas registradas" hint="Crea una ruta y agrégale clientes en orden de visita." />
      ) : (
        <div className="space-y-2">
          {routes.map((r) => (
            <Link key={r.id} to={`/rutas/${r.id}`} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-slate-500">{formatDate(r.route_date)}</p>
              </div>
              <span className="badge badge-pendiente">{r.status}</span>
            </Link>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva ruta">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre de la ruta</label>
            <input className="input" required placeholder="Ej: Ruta zona norte" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Creando…' : 'Crear ruta'}</button>
        </form>
      </Modal>
    </div>
  )
}
