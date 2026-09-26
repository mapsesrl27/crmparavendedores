import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types'

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { loading, userId, profile } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Cargando…</div>
  }
  if (!userId) return <Navigate to="/login" replace />
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
