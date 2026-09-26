import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatMoney, formatDate } from '../../lib/format'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Customer } from '../../types'

type Tab = 'ventas' | 'pagos' | 'deudas' | 'visitas' | 'compromisos' | 'reservas' | 'oportunidades'

export default function ClienteDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [tab, setTab] = useState<Tab>('deudas')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCustomer() }, [id])
  useEffect(() => { loadTab() }, [id, tab])

  async function loadCustomer() {
    const { data } = await supabase.from('customers').select('*').eq('id', id).single()
    setCustomer(data as Customer)
  }

  async function loadTab() {
    setLoading(true)
    let query: any
    switch (tab) {
      case 'ventas':
        query = supabase.from('sales').select('*').eq('customer_id', id).order('sale_date', { ascending: false })
        break
      case 'pagos':
        query = supabase.from('payments').select('*').eq('customer_id', id).order('payment_date', { ascending: false })
        break
      case 'deudas':
        query = supabase.from('accounts_receivable').select('*').eq('customer_id', id).order('due_date')
        break
      case 'visitas':
        query = supabase.from('visits').select('*').eq('customer_id', id).order('visit_date', { ascending: false })
        break
      case 'compromisos':
        query = supabase.from('payment_commitments').select('*').eq('customer_id', id).order('promised_date', { ascending: false })
        break
      case 'reservas':
        query = supabase.from('money_reservations').select('*').eq('customer_id', id).order('created_at', { ascending: false })
        break
      case 'oportunidades':
        query = supabase.from('opportunities').select('*').eq('customer_id', id).order('created_at', { ascending: false })
        break
    }
    const { data } = await query!
    setRows(data || [])
    setLoading(false)
  }

  if (!customer) return <p className="text-slate-400">Cargando…</p>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'deudas', label: 'Cuentas por cobrar' },
    { key: 'ventas', label: 'Ventas' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'visitas', label: 'Visitas' },
    { key: 'compromisos', label: 'Compromisos' },
    { key: 'reservas', label: 'Reservas' },
    { key: 'oportunidades', label: 'Oportunidades' },
  ]

  return (
    <div>
      <Link to="/clientes" className="text-sm text-teal-700">← Volver a clientes</Link>
      <PageHeader title={customer.business_name} subtitle={`${customer.phone || 'Sin teléfono'} · ${customer.address || 'Sin dirección'}`} />

      <div className="card mb-4 p-4 text-sm">
        <p><span className="text-slate-400">CI/NIT:</span> {customer.tax_id || '—'}</p>
        <p><span className="text-slate-400">Tipo:</span> {customer.customer_type || '—'}</p>
        {customer.notes && <p className="mt-1 text-slate-500">"{customer.notes}"</p>}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-navy-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Sin registros en esta sección" />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="card p-4 text-sm">
              {tab === 'deudas' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Saldo: {formatMoney(r.balance)}</p><p className="text-slate-400">Total: {formatMoney(r.total_amount)} · Vence: {formatDate(r.due_date)}</p></div>
                  <Badge status={r.status} />
                </div>
              )}
              {tab === 'ventas' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">{formatMoney(r.total)}</p><p className="text-slate-400">{formatDate(r.sale_date)} · {r.payment_type}</p></div>
                  <Badge status={r.status} />
                </div>
              )}
              {tab === 'pagos' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">{formatMoney(r.amount)}</p><p className="text-slate-400">{formatDate(r.payment_date)} · {r.method}</p></div>
                  {r.receipt_url && <a href={r.receipt_url} target="_blank" className="text-teal-700 text-xs">Ver comprobante</a>}
                </div>
              )}
              {tab === 'visitas' && (
                <div>
                  <p className="font-semibold">{r.reason} — {r.result}</p>
                  <p className="text-slate-400">{formatDate(r.visit_date)}</p>
                  {r.observation && <p className="mt-1 text-slate-500">{r.observation}</p>}
                </div>
              )}
              {tab === 'compromisos' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">{formatMoney(r.committed_amount)}</p><p className="text-slate-400">Promesa: {formatDate(r.promised_date)}</p></div>
                  <Badge status={r.status} />
                </div>
              )}
              {tab === 'reservas' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">{formatMoney(r.amount)}</p><p className="text-slate-400">Aplicado: {formatMoney(r.applied_amount)}</p></div>
                  <Badge status={r.status} />
                </div>
              )}
              {tab === 'oportunidades' && (
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">{formatMoney(r.estimated_amount)}</p><p className="text-slate-400">{r.next_action || 'Sin próxima acción'}</p></div>
                  <Badge status={r.stage} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
