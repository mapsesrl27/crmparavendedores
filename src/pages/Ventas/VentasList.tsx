import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatMoney, formatDate, todayISO } from '../../lib/format'
import type { Sale, Customer, Product } from '../../types'

interface ItemRow { product_id: string; quantity: number; unit_price: number }

export default function VentasList() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [sales, setSales] = useState<(Sale & { customer?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(params.get('nueva') === '1')
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ product_id: '', quantity: 1, unit_price: 0 }])
  const [discount, setDiscount] = useState(0)
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado')
  const [installmentsCount, setInstallmentsCount] = useState(1)

  useEffect(() => { load() }, [])

  async function load() {
    const [salesRes, custRes, prodRes] = await Promise.all([
      supabase.from('sales').select('*, customer:customers(*)').order('sale_date', { ascending: false }).limit(100),
      supabase.from('customers').select('*').order('business_name'),
      supabase.from('products').select('*').eq('active', true).order('name'),
    ])
    setSales((salesRes.data as any) || [])
    setCustomers((custRes.data as Customer[]) || [])
    setProducts((prodRes.data as Product[]) || [])
  }

  function updateItem(i: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  function onProductChange(i: number, productId: string) {
    const p = products.find((p) => p.id === productId)
    updateItem(i, { product_id: productId, unit_price: p ? Number(p.price) : 0 })
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  const total = Math.max(subtotal - discount, 0)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: sale, error } = await supabase.from('sales').insert({
        customer_id: customerId,
        sold_by: profile?.id,
        sale_date: todayISO(),
        subtotal, discount, total,
        payment_type: paymentType,
        status: 'completada',
      }).select().single()
      if (error) throw error

      const saleItems = items.filter((it) => it.product_id).map((it) => ({
        sale_id: sale.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        line_total: it.quantity * it.unit_price,
      }))
      if (saleItems.length) await supabase.from('sale_items').insert(saleItems)

      if (paymentType === 'credito') {
        const { data: receivable } = await supabase.from('accounts_receivable').insert({
          sale_id: sale.id,
          customer_id: customerId,
          total_amount: total,
          paid_amount: 0,
          balance: total,
          status: 'pendiente',
          due_date: addMonths(todayISO(), installmentsCount),
        }).select().single()

        if (receivable) {
          const perInstallment = Math.round((total / installmentsCount) * 100) / 100
          const installments = Array.from({ length: installmentsCount }).map((_, idx) => ({
            receivable_id: receivable.id,
            installment_number: idx + 1,
            amount: perInstallment,
            paid_amount: 0,
            due_date: addMonths(todayISO(), idx + 1),
            status: 'pendiente',
          }))
          await supabase.from('receivable_installments').insert(installments)
        }
      }

      setOpen(false)
      setParams({})
      setCustomerId('')
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }])
      setDiscount(0)
      setPaymentType('contado')
      setInstallmentsCount(1)
      load()
    } finally {
      setSaving(false)
    }
  }

  function addMonths(iso: string, months: number) {
    const d = new Date(iso)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="Registro de ventas de contado y a crédito"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nueva venta</button>}
      />
      {sales.length === 0 ? (
        <EmptyState title="Aún no hay ventas registradas" />
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <Link key={s.id} to={`/ventas/${s.id}`} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{s.customer?.business_name}</p>
                <p className="text-sm text-slate-500">{formatDate(s.sale_date)} · {s.payment_type}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatMoney(s.total)}</p>
                <Badge status={s.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setParams({}) }} title="Nueva venta">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Selecciona…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Productos / servicios</label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <select className="input col-span-6" value={it.product_id} onChange={(e) => onProductChange(i, e.target.value)}>
                    <option value="">Producto…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input col-span-2" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                  <input className="input col-span-3" type="number" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} title="Precio (editable para precios especiales)" />
                  <button type="button" className="col-span-1 text-red-500" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm text-teal-700" onClick={() => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])}>
              ＋ Agregar producto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Descuento (Bs)</label>
              <input className="input" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Forma de pago</label>
              <select className="input" value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
          </div>

          {paymentType === 'credito' && (
            <div>
              <label className="label">Número de cuotas</label>
              <input className="input" type="number" min={1} value={installmentsCount} onChange={(e) => setInstallmentsCount(Number(e.target.value))} />
            </div>
          )}

          <div className="card bg-slate-50 p-3 text-sm">
            <p>Subtotal: {formatMoney(subtotal)}</p>
            <p className="font-bold text-navy-900">Total: {formatMoney(total)}</p>
          </div>

          <button className="btn btn-primary w-full" disabled={saving || !customerId}>{saving ? 'Guardando…' : 'Registrar venta'}</button>
        </form>
      </Modal>
    </div>
  )
}
