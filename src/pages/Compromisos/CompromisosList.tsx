import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatMoney, formatDate, todayISO } from '../../lib/format'
import type { PaymentCommitment, Customer } from '../../types'

export default function CompromisosList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<(PaymentCommitment & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'hoy' | 'proximos' | 'vencidos' | 'todos'>('todos')

  const [form, setForm] = useState({ customer_id: '', debt_amount: '', committed_amount: '', promised_date: todayISO() })

  useEffect(() => { load() }, [])

  async function load() {
    const [rowsRes, custRes] = await Promise.all([
      supabase.from('payment_commitments').select('*, customer:customers(*)').order('promised_date'),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setRows((rowsRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('payment_commitments').insert({
      customer_id: form.customer_id,
      debt_amount: Number(form.debt_amount),
      committed_amount: Number(form.committed_amount),
      promised_date: form.promised_date,
      status: 'pendiente',
      created_by: profile?.id,
    })
    setSaving(false)
    setOpen(false)
    setParams({})
    setForm({ customer_id: '', debt_amount: '', committed_amount: '', promised_date: todayISO() })
    load()
  }

  const today = todayISO()
  const filtered = rows.filter((r) => {
    if (filter === 'hoy') return r.promised_date === today
    if (filter === 'proximos') return r.promised_date > today && r.status === 'pendiente'
    if (filter === 'vencidos') return r.promised_date < today && r.status === 'pendiente'
    return true
  })

  return (
    <div>
      <PageHeader
        title="Compromisos de pago"
        subtitle="Promesas de pago de los clientes"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo compromiso</button>}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(['todos', 'hoy', 'proximos', 'vencidos'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-navy-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No hay compromisos en este filtro" />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{r.customer?.business_name}</p>
                <p className="text-sm text-slate-500">Deuda {formatMoney(r.debt_amount)} · Promete {formatMoney(r.committed_amount)} · {formatDate(r.promised_date)}</p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Nuevo compromiso de pago">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Deuda total (Bs)</label>
              <input className="input" type="number" step="0.01" required value={form.debt_amount} onChange={(e) => setForm({ ...form, debt_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Monto comprometido (Bs)</label>
              <input className="input" type="number" step="0.01" required value={form.committed_amount} onChange={(e) => setForm({ ...form, committed_amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Fecha prometida</label>
            <input className="input" type="date" required value={form.promised_date} onChange={(e) => setForm({ ...form, promised_date: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Registrar compromiso'}</button>
        </form>
      </Modal>
    </div>
  )
}
