import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import type { RouteRow, RouteStop, Customer } from '../../types'

export default function RutaDetail() {
  const { id } = useParams()
  const [route, setRoute] = useState<RouteRow | null>(null)
  const [stops, setStops] = useState<(RouteStop & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ customer_id: '', planned_time: '', reason: 'venta' })

  useEffect(() => { load() }, [id])

  async function load() {
    const [routeRes, stopsRes, custRes] = await Promise.all([
      supabase.from('routes').select('*').eq('id', id).single(),
      supabase.from('route_stops').select('*, customer:customers(*)').eq('route_id', id).order('visit_order'),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setRoute(routeRes.data as RouteRow)
    setStops((stopsRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
  }

  async function addStop(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('route_stops').insert({
      route_id: id,
      customer_id: form.customer_id,
      visit_order: stops.length + 1,
      planned_time: form.planned_time || null,
      reason: form.reason,
      status: 'pendiente',
    })
    setOpen(false)
    setForm({ customer_id: '', planned_time: '', reason: 'venta' })
    load()
  }

  async function markStop(stopId: string, status: RouteStop['status']) {
    await supabase.from('route_stops').update({ status }).eq('id', stopId)
    load()
  }

  if (!route) return <p className="text-slate-400">Cargando…</p>

  return (
    <div>
      <Link to="/rutas" className="text-sm text-teal-700">← Volver a rutas</Link>
      <PageHeader
        title={route.name}
        subtitle={`${stops.length} paradas`}
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Agregar cliente</button>}
      />

      {stops.length === 0 ? (
        <EmptyState title="Esta ruta aún no tiene clientes" />
      ) : (
        <div className="space-y-2">
          {stops.map((s, i) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{i + 1}. {s.customer?.business_name}</p>
                  <p className="text-sm text-slate-500">{s.customer?.address} {s.planned_time && `· ${s.planned_time}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Motivo: {s.reason}</p>
                </div>
                <span className={`badge ${s.status === 'visitado' ? 'badge-pagado' : 'badge-pendiente'}`}>{s.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.customer?.address && (
                  <a
                    className="btn btn-secondary text-xs"
                    target="_blank"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.customer.address)}`}
                  >
                    📍 Ver en mapa
                  </a>
                )}
                <button className="btn btn-secondary text-xs" onClick={() => markStop(s.id, 'visitado')}>Marcar visitado</button>
                <button className="btn btn-secondary text-xs" onClick={() => markStop(s.id, 'no_encontrado')}>No encontrado</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar cliente a la ruta">
        <form onSubmit={addStop} className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hora prevista</label>
              <input className="input" type="time" value={form.planned_time} onChange={(e) => setForm({ ...form, planned_time: e.target.value })} />
            </div>
            <div>
              <label className="label">Motivo</label>
              <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option value="venta">Venta</option>
                <option value="cobranza">Cobranza</option>
                <option value="seguimiento">Seguimiento</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary w-full">Agregar</button>
        </form>
      </Modal>
    </div>
  )
}
