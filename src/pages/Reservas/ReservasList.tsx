import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatMoney, formatDate } from '../../lib/format'
import type { MoneyReservation, Customer } from '../../types'

export default function ReservasList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<(MoneyReservation & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customer_id: '', amount: '', purpose: '', observation: '' })
  const [applyRow, setApplyRow] = useState<MoneyReservation | null>(null)
  const [applyAmount, setApplyAmount] = useState('')
  const [applyNote, setApplyNote] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [rowsRes, custRes] = await Promise.all([
      supabase.from('money_reservations').select('*, customer:customers(*)').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setRows((rowsRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('money_reservations').insert({
      customer_id: form.customer_id,
      created_by: profile?.id,
      amount: Number(form.amount),
      applied_amount: 0,
      purpose: form.purpose || null,
      observation: form.observation || null,
      status: 'disponible',
    })
    setSaving(false)
    setOpen(false)
    setParams({})
    setForm({ customer_id: '', amount: '', purpose: '', observation: '' })
    load()
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!applyRow) return
    const amount = Number(applyAmount)
    const available = Number(applyRow.amount) - Number(applyRow.applied_amount)
    if (amount <= 0 || amount > available) return
    const newApplied = Number(applyRow.applied_amount) + amount
    const status = newApplied >= Number(applyRow.amount) ? 'utilizada' : 'parcial'
    await supabase.from('money_reservation_applications').insert({
      reservation_id: applyRow.id, amount, note: applyNote || null,
    })
    await supabase.from('money_reservations').update({ applied_amount: newApplied, status }).eq('id', applyRow.id)
    setApplyRow(null)
    setApplyAmount('')
    setApplyNote('')
    load()
  }

  return (
    <div>
      <PageHeader
        title="Reservas de dinero"
        subtitle="Dinero entregado por el cliente para una futura venta"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nueva reserva</button>}
      />
      {rows.length === 0 ? (
        <EmptyState title="No hay reservas registradas" />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{r.customer?.business_name}</p>
                <p className="text-sm text-slate-500">Disponible {formatMoney(Number(r.amount) - Number(r.applied_amount))} de {formatMoney(r.amount)} · {formatDate(r.created_at)}</p>
                {r.purpose && <p className="text-xs text-slate-400">{r.purpose}</p>}
              </div>
              <div className="text-right">
                <Badge status={r.status} />
                {r.status !== 'utilizada' && r.status !== 'devuelta' && r.status !== 'anulada' && (
                  <button className="mt-1 block text-xs text-teal-700" onClick={() => setApplyRow(r)}>Aplicar a venta</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!applyRow} onClose={() => setApplyRow(null)} title="Aplicar reserva a una venta">
        {applyRow && (
          <form onSubmit={handleApply} className="space-y-3">
            <p className="text-sm text-slate-500">
              Disponible: {formatMoney(Number(applyRow.amount) - Number(applyRow.applied_amount))}
            </p>
            <div>
              <label className="label">Monto a aplicar (Bs)</label>
              <input className="input" type="number" step="0.01" required value={applyAmount} onChange={(e) => setApplyAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Nota (ej: N° de venta o referencia)</label>
              <input className="input" value={applyNote} onChange={(e) => setApplyNote(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full">Aplicar</button>
          </form>
        )}
      </Modal>
      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Nueva reserva de dinero">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monto (Bs)</label>
            <input className="input" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Motivo / destino</label>
            <input className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Ej: reserva para próxima compra de mercadería" />
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input" rows={2} value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Registrar reserva'}</button>
        </form>
      </Modal>
    </div>
  )
}
