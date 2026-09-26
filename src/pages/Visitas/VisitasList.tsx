import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatDateTime, todayISO } from '../../lib/format'
import type { Visit, Customer } from '../../types'

const RESULTS = ['Visitado', 'No encontrado', 'Vendió', 'No vendió', 'Cobró', 'No cobró', 'Reprogramar', 'Nueva oportunidad']

export default function VisitasList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [visits, setVisits] = useState<(Visit & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [form, setForm] = useState({ customer_id: '', reason: 'Venta', result: 'Visitado', observation: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [visitsRes, custRes] = await Promise.all([
      supabase.from('visits').select('*, customer:customers(*)').order('visit_date', { ascending: false }).limit(100),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setVisits((visitsRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('visits').insert({
      customer_id: form.customer_id,
      visited_by: profile?.id,
      visit_date: new Date().toISOString(),
      reason: form.reason,
      result: form.result,
      observation: form.observation || null,
    })
    setSaving(false)
    setOpen(false)
    setParams({})
    setForm({ customer_id: '', reason: 'Venta', result: 'Visitado', observation: '' })
    load()
  }

  return (
    <div>
      <PageHeader
        title="Visitas"
        subtitle="Historial de visitas a clientes"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Registrar visita</button>}
      />
      {visits.length === 0 ? (
        <EmptyState title="Aún no registraste visitas" />
      ) : (
        <div className="space-y-2">
          {visits.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{v.customer?.business_name}</p>
                <span className="badge badge-pagado">{v.result}</span>
              </div>
              <p className="text-sm text-slate-500">{v.reason} · {formatDateTime(v.visit_date)}</p>
              {v.observation && <p className="mt-1 text-sm text-slate-500">{v.observation}</p>}
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Registrar visita">
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
              <label className="label">Motivo</label>
              <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option>Venta</option><option>Cobranza</option><option>Seguimiento</option>
              </select>
            </div>
            <div>
              <label className="label">Resultado</label>
              <select className="input" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>
                {RESULTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Observación</label>
            <textarea className="input" rows={2} value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Registrar'}</button>
        </form>
      </Modal>
    </div>
  )
}
