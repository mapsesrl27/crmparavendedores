export type Role = 'admin' | 'supervisor' | 'vendedor' | 'cobrador'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

export interface Customer {
  id: string
  business_name: string
  tax_id: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  customer_type: string | null
  assigned_to: string | null
  status: 'activo' | 'inactivo'
  notes: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  code: string | null
  description: string | null
  category: string | null
  price: number
  active: boolean
}

export interface Opportunity {
  id: string
  customer_id: string
  assigned_to: string
  product_id: string | null
  estimated_amount: number | null
  stage: 'prospecto' | 'contactado' | 'interesado' | 'cotizacion' | 'negociacion' | 'venta' | 'postventa'
  next_action: string | null
  follow_up_date: string | null
  probability: number | null
  notes: string | null
  created_at: string
}

export interface RouteRow {
  id: string
  name: string
  assigned_to: string
  route_date: string
  status: 'planificada' | 'en_curso' | 'completada'
}

export interface RouteStop {
  id: string
  route_id: string
  customer_id: string
  visit_order: number
  planned_time: string | null
  reason: string | null
  status: 'pendiente' | 'visitado' | 'no_encontrado' | 'reprogramado'
}

export interface Visit {
  id: string
  customer_id: string
  route_stop_id: string | null
  visited_by: string
  visit_date: string
  reason: string
  result: string
  observation: string | null
}

export interface Sale {
  id: string
  customer_id: string
  sold_by: string
  sale_date: string
  subtotal: number
  discount: number
  total: number
  payment_type: 'contado' | 'credito'
  status: 'completada' | 'anulada'
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface AccountReceivable {
  id: string
  sale_id: string
  customer_id: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'pendiente' | 'parcial' | 'pagado' | 'vencido'
  due_date: string | null
}

export interface Installment {
  id: string
  receivable_id: string
  installment_number: number
  amount: number
  paid_amount: number
  due_date: string
  status: 'pendiente' | 'parcial' | 'pagado' | 'vencido'
}

export interface Payment {
  id: string
  receivable_id: string | null
  customer_id: string
  amount: number
  payment_date: string
  method: 'efectivo' | 'qr' | 'transferencia' | 'otro'
  observation: string | null
  receipt_url: string | null
  collected_by: string
}

export interface PaymentCommitment {
  id: string
  customer_id: string
  receivable_id: string | null
  debt_amount: number
  committed_amount: number
  promised_date: string
  status: 'pendiente' | 'cumplido' | 'incumplido' | 'reprogramado'
  created_by: string
  linked_payment_id: string | null
}

export interface MoneyReservation {
  id: string
  customer_id: string
  created_by: string
  amount: number
  applied_amount: number
  purpose: string | null
  status: 'disponible' | 'parcial' | 'utilizada' | 'devuelta' | 'anulada'
  observation: string | null
  created_at: string
}
