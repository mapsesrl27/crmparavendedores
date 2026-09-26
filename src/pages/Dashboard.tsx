import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney, todayISO } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'

interface Stats {
  ventasHoy: number
  ventasMes: number
  cobradoHoy: number
  carteraPendiente: number
  carteraVencida: number
  compromisosVencidos: number
  reservasDisponibles: number
  visitasHoy: number
  oportunidadesAbiertas: number
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warn' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-navy-900'
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${toneClass}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const isFieldRole = profile?.role === 'vendedor' || profile?.role === 'cobrador'

  useEffect(() => {
    if (!profile) return
    loadStats()
  }, [profile])

  async function loadStats() {
    const today = todayISO()
    const monthStart = today.slice(0, 8) + '01'
    const mine = isFieldRole
    const uid = profile!.id

    let salesTodayQ = supabase.from('sales').select('total').gte('sale_date', today)
    let salesMonthQ = supabase.from('sales').select('total').gte('sale_date', monthStart)
    let paymentsTodayQ = supabase.from('payments').select('amount').gte('payment_date', today)
    let receivablesQ = supabase.from('accounts_receivable').select('balance,status')
    let commitmentsQ = supabase.from('payment_commitments').select('id').lt('promised_date', today).eq('status', 'pendiente')
    let reservationsQ = supabase.from('money_reservations').select('amount,applied_amount').in('status', ['disponible', 'parcial'])
    let visitsTodayQ = supabase.from('visits').select('id').gte('visit_date', today)
    let oppsQ = supabase.from('opportunities').select('id').not('stage', 'in', '("venta","postventa")')

    if (mine) {
      salesTodayQ = salesTodayQ.eq('sold_by', uid)
      salesMonthQ = salesMonthQ.eq('sold_by', uid)
      paymentsTodayQ = paymentsTodayQ.eq('collected_by', uid)
      visitsTodayQ = visitsTodayQ.eq('visited_by', uid)
      oppsQ = oppsQ.eq('assigned_to', uid)
    }

    const [salesToday, salesMonth, paymentsToday, receivables, commitments, reservations, visitsToday, opps] = await Promise.all([
      salesTodayQ, salesMonthQ, paymentsTodayQ, receivablesQ, commitmentsQ, reservationsQ, visitsTodayQ, oppsQ,
    ])

    const carteraPendiente = (receivables.data || []).reduce((s, r: any) => s + Number(r.balance || 0), 0)
    const carteraVencida = (receivables.data || []).filter((r: any) => r.status === 'vencido').reduce((s, r: any) => s + Number(r.balance || 0), 0)
    const reservasDisponibles = (reservations.data || []).reduce((s, r: any) => s + (Number(r.amount) - Number(r.applied_amount)), 0)

    setStats({
      ventasHoy: (salesToday.data || []).reduce((s, r: any) => s + Number(r.total || 0), 0),
      ventasMes: (salesMonth.data || []).reduce((s, r: any) => s + Number(r.total || 0), 0),
      cobradoHoy: (paymentsToday.data || []).reduce((s, r: any) => s + Number(r.amount || 0), 0),
      carteraPendiente,
      carteraVencida,
      compromisosVencidos: (commitments.data || []).length,
      reservasDisponibles,
      visitasHoy: (visitsToday.data || []).length,
      oportunidadesAbiertas: (opps.data || []).length,
    })
  }

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile?.full_name?.split(' ')[0] || ''}`}
        subtitle={isFieldRole ? 'Este es tu resumen del día' : 'Resumen general de la operación'}
      />
      {!stats ? (
        <p className="text-slate-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Ventas de hoy" value={formatMoney(stats.ventasHoy)} />
          <StatCard label="Ventas del mes" value={formatMoney(stats.ventasMes)} />
          <StatCard label="Cobrado hoy" value={formatMoney(stats.cobradoHoy)} />
          <StatCard label="Cartera pendiente" value={formatMoney(stats.carteraPendiente)} tone="warn" />
          <StatCard label="Cartera vencida" value={formatMoney(stats.carteraVencida)} tone="danger" />
          <StatCard label="Compromisos vencidos" value={String(stats.compromisosVencidos)} tone={stats.compromisosVencidos > 0 ? 'danger' : 'default'} />
          <StatCard label="Reservas disponibles" value={formatMoney(stats.reservasDisponibles)} />
          <StatCard label={isFieldRole ? 'Mis visitas hoy' : 'Visitas hoy'} value={String(stats.visitasHoy)} />
          <StatCard label={isFieldRole ? 'Mis oportunidades abiertas' : 'Oportunidades abiertas'} value={String(stats.oportunidadesAbiertas)} />
        </div>
      )}
    </div>
  )
}
