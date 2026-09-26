import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import type { Customer } from '../../types'

export default function ClientesList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(params.get('nueva') === '1')

  const [form, setForm] = useState({ business_name: '', tax_id: '', phone: '', whatsapp: '', address: '', customer_type: 'regular', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('business_name')
    setCustomers((data as Customer[]) || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('customers').insert({
      ...form,
      assigned_to: profile?.id,
      status: 'activo',
    })
    setSaving(false)
    setOpen(false)
    setParams({})
    setForm({ business_name: '', tax_id: '', phone: '', whatsapp: '', address: '', customer_type: 'regular', notes: '' })
    load()
  }

  const filtered = customers.filter((c) =>
    c.business_name.toLowerCase().includes(search.toLowerCase()) || (c.tax_id || '').includes(search)
  )

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes en cartera`}
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo cliente</button>}
      />

      <input className="input mb-4" placeholder="Buscar por nombre o CI/NIT…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="Aún no hay clientes" hint="Registra tu primer cliente con el botón de arriba." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} to={`/clientes/${c.id}`} className="card flex items-center justify-between p-4 hover:border-teal-600">
              <div>
                <p className="font-semibold text-navy-900">{c.business_name}</p>
                <p className="text-sm text-slate-500">{c.phone || 'Sin teléfono'} · {c.address || 'Sin dirección'}</p>
              </div>
              <span className={`badge ${c.status === 'activo' ? 'badge-pagado' : 'badge-anulada'}`}>{c.status}</span>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Nuevo cliente">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre o razón social</label>
            <input className="input" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">CI/NIT</label>
              <input className="input" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            </div>
            <div>
              <label className="label">Tipo de cliente</label>
              <select className="input" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
                <option value="regular">Regular</option>
                <option value="mayorista">Mayorista</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cliente'}</button>
        </form>
      </Modal>
    </div>
  )
}
