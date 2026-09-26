import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatMoney, formatDate } from '../../lib/format'
import type { Sale, SaleItem, Customer, Product } from '../../types'

export default function VentaDetail() {
  const { id } = useParams()
  const [sale, setSale] = useState<(Sale & { customer?: Customer }) | null>(null)
  const [items, setItems] = useState<(SaleItem & { product?: Product })[]>([])

  useEffect(() => {
    (async () => {
      const [saleRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*, customer:customers(*)').eq('id', id).single(),
        supabase.from('sale_items').select('*, product:products(*)').eq('sale_id', id),
      ])
      setSale(saleRes.data as any)
      setItems((itemsRes.data as any) || [])
    })()
  }, [id])

  if (!sale) return <p className="text-slate-400">Cargando…</p>

  return (
    <div>
      <Link to="/ventas" className="text-sm text-teal-700">← Volver a ventas</Link>
      <PageHeader title={`Venta a ${sale.customer?.business_name}`} subtitle={`${formatDate(sale.sale_date)} · ${sale.payment_type}`} />
      <div className="card divide-y divide-slate-100">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 text-sm">
            <span>{it.product?.name} × {it.quantity}</span>
            <span>{formatMoney(it.line_total)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between p-3 font-bold text-navy-900">
          <span>Total</span>
          <span>{formatMoney(sale.total)}</span>
        </div>
      </div>
    </div>
  )
}
