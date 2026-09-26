import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import type { Profile, Role } from '../../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export default function Usuarios() {
  const [users, setUsers] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'vendedor' as Role })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers((data as Profile[]) || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Usamos un cliente temporal e independiente para no cerrar tu sesión de administrador.
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      const { data, error: signUpError } = await tempClient.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No se pudo crear el usuario.')

      const { error: profileError } = await tempClient.from('profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        active: true,
      })
      if (profileError) throw profileError

      await tempClient.auth.signOut()

      setOpen(false)
      setForm({ full_name: '', email: '', password: '', role: 'vendedor' })
      load()
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Vendedores, supervisores y cobradores"
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo usuario</button>}
      />
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{u.full_name}</p>
              <p className="text-sm text-slate-500">{u.email}</p>
            </div>
            <Badge status={u.role} />
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo usuario">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Contraseña temporal</label>
            <input className="input" type="text" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="vendedor">Vendedor</option>
              <option value="supervisor">Supervisor</option>
              <option value="cobrador">Cobrador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Creando…' : 'Crear usuario'}</button>
        </form>
      </Modal>
    </div>
  )
}
