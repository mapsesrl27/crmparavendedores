import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { exportToExcel } from '../../lib/export'
import { todayISO } from '../../lib/format'

interface ReportDef {
  key: string
  label: string
  group: string
  run: () => Promise<Record<string, any>[]>
}

export default function Reportes() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const reports: ReportDef[] = [
    {
      key: 'ventas_vendedor', label: 'Ventas por vendedor', group: 'Ventas',
      run: async () => {
        const { data } = await supabase.from('sales').select('sale_date,total,payment_type,status,sold_by,customer:customers(business_name),seller:profiles!sales_sold_by_fkey(full_name)')
        return (data || []).map((r: any) => ({
          Fecha: r.sale_date, Cliente: r.customer?.business_name, Vendedor: r.seller?.full_name,
          Total: r.total, Tipo: r.payment_type, Estado: r.status,
        }))
      },
    },
    {
      key: 'total_vendido', label: 'Total vendido (todas las ventas)', group: 'Ventas',
      run: async () => {
        const { data } = await supabase.from('sales').select('sale_date,total,customer:customers(business_name)')
        return (data || []).map((r: any) => ({ Fecha: r.sale_date, Cliente: r.customer?.business_name, Total: r.total }))
      },
    },
    {
      key: 'cobranza_periodo', label: 'Cobranza por período', group: 'Cobranzas',
      run: async () => {
        const { data } = await supabase.from('payments').select('payment_date,amount,method,customer:customers(business_name)')
        return (data || []).map((r: any) => ({ Fecha: r.payment_date, Cliente: r.customer?.business_name, Monto: r.amount, Método: r.method }))
      },
    },
    {
      key: 'cartera_pendiente', label: 'Cartera pendiente y vencida', group: 'Cobranzas',
      run: async () => {
        const { data } = await supabase.from('accounts_receivable').select('due_date,total_amount,paid_amount,balance,status,customer:customers(business_name)')
        return (data || []).map((r: any) => ({
          Cliente: r.customer?.business_name, Total: r.total_amount, Pagado: r.paid_amount,
          Saldo: r.balance, Estado: r.status, Vence: r.due_date,
        }))
      },
    },
    {
      key: 'embudo', label: 'Oportunidades y etapas del embudo', group: 'Comercial',
      run: async () => {
        const { data } = await supabase.from('opportunities').select('stage,estimated_amount,follow_up_date,customer:customers(business_name)')
        return (data || []).map((r: any) => ({
          Cliente: r.customer?.business_name, Etapa: r.stage, Monto: r.estimated_amount, Seguimiento: r.follow_up_date,
        }))
      },
    },
    {
      key: 'visitas', label: 'Visitas programadas y realizadas', group: 'Rutas',
      run: async () => {
        const { data } = await supabase.from('visits').select('visit_date,reason,result,customer:customers(business_name)')
        return (data || []).map((r: any) => ({ Fecha: r.visit_date, Cliente: r.customer?.business_name, Motivo: r.reason, Resultado: r.result }))
      },
    },
    {
      key: 'reservas', label: 'Reservas de dinero (todas)', group: 'Reservas',
      run: async () => {
        const { data } = await supabase.from('money_reservations').select('created_at,amount,applied_amount,status,customer:customers(business_name)')
        return (data || []).map((r: any) => ({
          Fecha: r.created_at, Cliente: r.customer?.business_name, Monto: r.amount, Aplicado: r.applied_amount, Estado: r.status,
        }))
      },
    },
  ]

  async function handleExport(report: ReportDef) {
    setLoadingKey(report.key)
    try {
      const rows = await report.run()
      await exportToExcel(`${report.key}_${todayISO()}`, rows, report.label.slice(0, 28))
    } finally {
      setLoadingKey(null)
    }
  }

  const groups = Array.from(new Set(reports.map((r) => r.group)))

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Exporta cualquier reporte a Excel" />
      {groups.map((g) => (
        <div key={g} className="mb-5">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{g}</p>
          <div className="space-y-2">
            {reports.filter((r) => r.group === g).map((r) => (
              <div key={r.key} className="card flex items-center justify-between p-4">
                <p className="font-medium text-navy-900">{r.label}</p>
                <button className="btn btn-secondary" disabled={loadingKey === r.key} onClick={() => handleExport(r)}>
                  {loadingKey === r.key ? 'Generando…' : '⬇ Excel'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
