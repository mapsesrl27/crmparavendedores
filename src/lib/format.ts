export function formatMoney(value: number | null | undefined) {
  const n = Number(value || 0)
  return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
