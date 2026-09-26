import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'
import { formatMoney, formatDate } from '../../lib/format'
import type { AccountReceivable, Customer } from '../../types'

export default function CuentasList() {
  const [rows, setRows] = useState<(AccountReceivable & { customer?: Customer })[]>([])
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'parcial' | 'vencido' | 'pagado'>('todos')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('accounts_receivable').select('*, customer:customers(*)').order('due_date')
    setRows((data as any) || [])
  }

  const filtered = filter === 'todos' ? rows : rows.filter((r) => r.status === filter)
  const totalPendiente = rows.reduce((s, r) => s + Number(r.balance || 0), 0)

  return (
    <div>
      <PageHeader title="Cuentas por cobrar" subtitle={`Cartera pendiente total: ${formatMoney(totalPendiente)}`} />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(['todos', 'pendiente', 'parcial', 'vencido', 'pagado'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-navy-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No hay cuentas en este filtro" />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{r.customer?.business_name}</p>
                <p className="text-sm text-slate-500">Total {formatMoney(r.total_amount)} · Pagado {formatMoney(r.paid_amount)} · Vence {formatDate(r.due_date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy-900">{formatMoney(r.balance)}</p>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
