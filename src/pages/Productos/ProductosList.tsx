import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatMoney } from '../../lib/format'
import type { Product } from '../../types'

export default function ProductosList() {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', category: '', price: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts((data as Product[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('products').insert({
      name: form.name, code: form.code || null, description: form.description || null,
      category: form.category || null, price: Number(form.price), active: true,
    })
    setSaving(false)
    setOpen(false)
    setForm({ name: '', code: '', description: '', category: '', price: '' })
    load()
  }

  return (
    <div>
      <PageHeader
        title="Productos y servicios"
        subtitle="Catálogo usado en ventas y oportunidades"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo producto</button>}
      />
      {products.length === 0 ? (
        <EmptyState title="Aún no hay productos en el catálogo" />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-500">{p.category || 'Sin categoría'} {p.code && `· ${p.code}`}</p>
              </div>
              <p className="font-bold text-navy-900">{formatMoney(p.price)}</p>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo producto o servicio">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código</label>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Precio (Bs)</label>
            <input className="input" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
        </form>
      </Modal>
    </div>
  )
}
