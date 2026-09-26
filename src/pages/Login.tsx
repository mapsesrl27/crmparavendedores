import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError('Correo o contraseña incorrectos.')
    else navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-2xl text-white">🧭</div>
          <h1 className="text-xl font-extrabold text-navy-900">CRM Vendedores de Campo</h1>
          <p className="text-sm text-slate-500">Ingresa con tu correo y contraseña</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@empresa.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
