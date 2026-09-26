import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { formatMoney } from '../../lib/format'
import { useSearchParams } from 'react-router-dom'
import type { Customer, Opportunity } from '../../types'

const STAGES: { key: Opportunity['stage']; label: string }[] = [
  { key: 'prospecto', label: 'Prospecto' },
  { key: 'contactado', label: 'Contactado' },
  { key: 'interesado', label: 'Interesado' },
  { key: 'cotizacion', label: 'Cotización' },
  { key: 'negociacion', label: 'Negociación' },
  { key: 'venta', label: 'Venta' },
  { key: 'postventa', label: 'Postventa' },
]

export default function OportunidadesKanban() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [form, setForm] = useState({ customer_id: '', estimated_amount: '', next_action: '', follow_up_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [opps, custs] = await Promise.all([
      supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setOpportunities((opps.data as Opportunity[]) || [])
    setCustomers((custs.data as Customer[]) || [])
  }

  async function moveStage(id: string, stage: Opportunity['stage']) {
    await supabase.from('opportunities').update({ stage }).eq('id', id)
    load()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('opportunities').insert({
      customer_id: form.customer_id,
      assigned_to: profile?.id,
      estimated_amount: form.estimated_amount ? Number(form.estimated_amount) : null,
      next_action: form.next_action || null,
      follow_up_date: form.follow_up_date || null,
      notes: form.notes || null,
      stage: 'prospecto',
    })
    setSaving(false)
    setOpen(false)
    setParams({})
    setForm({ customer_id: '', estimated_amount: '', next_action: '', follow_up_date: '', notes: '' })
    load()
  }

  function customerName(cid: string) {
    return customers.find((c) => c.id === cid)?.business_name || '—'
  }

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        subtitle="Embudo comercial"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nueva oportunidad</button>}
      />

      <div className="flex gap-3 overflow-x-auto pb-3">
        {STAGES.map((stage) => (
          <div key={stage.key} className="w-64 shrink-0">
            <p className="mb-2 text-sm font-bold text-navy-800">{stage.label} ({opportunities.filter((o) => o.stage === stage.key).length})</p>
            <div className="space-y-2">
              {opportunities.filter((o) => o.stage === stage.key).map((o) => (
                <div key={o.id} className="card p-3 text-sm">
                  <p className="font-semibold">{customerName(o.customer_id)}</p>
                  <p className="text-slate-400">{formatMoney(o.estimated_amount)}</p>
                  {o.next_action && <p className="mt-1 text-xs text-slate-500">Próx: {o.next_action}</p>}
                  <select
                    className="input mt-2 text-xs"
                    value={o.stage}
                    onChange={(e) => moveStage(o.id, e.target.value as Opportunity['stage'])}
                  >
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Nueva oportunidad">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Cliente/prospecto</label>
            <select className="input" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto estimado (Bs)</label>
              <input className="input" type="number" step="0.01" value={form.estimated_amount} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Fecha de seguimiento</label>
              <input className="input" type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Próxima acción</label>
            <input className="input" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Crear oportunidad'}</button>
        </form>
      </Modal>
    </div>
  )
}
