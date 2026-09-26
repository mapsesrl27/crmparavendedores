import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatMoney, formatDate, todayISO } from '../../lib/format'
import type { Payment, Customer, AccountReceivable } from '../../types'

export default function CobranzasList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [payments, setPayments] = useState<(Payment & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [receivables, setReceivables] = useState<AccountReceivable[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [receivableId, setReceivableId] = useState('')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<'efectivo' | 'qr' | 'transferencia' | 'otro'>('efectivo')
  const [observation, setObservation] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { load() }, [])
  useEffect(() => { if (customerId) loadReceivables(customerId); else setReceivables([]) }, [customerId])

  async function load() {
    const [paymentsRes, custRes] = await Promise.all([
      supabase.from('payments').select('*, customer:customers(*)').order('payment_date', { ascending: false }).limit(100),
      supabase.from('customers').select('*').order('business_name'),
    ])
    setPayments((paymentsRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
  }

  async function loadReceivables(cid: string) {
    const { data } = await supabase.from('accounts_receivable').select('*').eq('customer_id', cid).in('status', ['pendiente', 'parcial', 'vencido'])
    setReceivables((data as AccountReceivable[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let receiptUrl: string | null = null
      if (file) {
        const path = `${profile?.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('comprobantes-pago').upload(path, file)
        if (!uploadError) {
          const { data } = supabase.storage.from('comprobantes-pago').getPublicUrl(path)
          receiptUrl = data.publicUrl
        }
      }

      await supabase.from('payments').insert({
        receivable_id: receivableId || null,
        customer_id: customerId,
        amount,
        payment_date: todayISO(),
        method,
        observation: observation || null,
        receipt_url: receiptUrl,
        collected_by: profile?.id,
      })

      if (receivableId) {
        const receivable = receivables.find((r) => r.id === receivableId)
        if (receivable) {
          const newPaid = Number(receivable.paid_amount) + amount
          const newBalance = Math.max(Number(receivable.total_amount) - newPaid, 0)
          const status = newBalance === 0 ? 'pagado' : 'parcial'
          await supabase.from('accounts_receivable').update({ paid_amount: newPaid, balance: newBalance, status }).eq('id', receivableId)
        }
      }

      setOpen(false)
      setParams({})
      setCustomerId(''); setReceivableId(''); setAmount(0); setObservation(''); setFile(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Cobranzas"
        subtitle="Pagos registrados por vendedores y cobradores"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Registrar pago</button>}
      />
      {payments.length === 0 ? (
        <EmptyState title="Aún no hay pagos registrados" />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{p.customer?.business_name}</p>
                <p className="text-sm text-slate-500">{formatDate(p.payment_date)} · {p.method}</p>
              </div>
              <p className="font-bold text-teal-700">{formatMoney(p.amount)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Registrar pago">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          {receivables.length > 0 && (
            <div>
              <label className="label">Cuenta por cobrar (opcional)</label>
              <select className="input" value={receivableId} onChange={(e) => setReceivableId(e.target.value)}>
                <option value="">Pago general del cliente</option>
                {receivables.map((r) => <option key={r.id} value={r.id}>Saldo {formatMoney(r.balance)}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto (Bs)</label>
              <input className="input" type="number" step="0.01" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Método</label>
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Foto del comprobante</label>
            <input className="input" type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="label">Observación</label>
            <textarea className="input" rows={2} value={observation} onChange={(e) => setObservation(e.target.value)} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Registrar pago'}</button>
        </form>
      </Modal>
    </div>
  )
}
