import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientesList from './pages/Clientes/ClientesList'
import ClienteDetail from './pages/Clientes/ClienteDetail'
import OportunidadesKanban from './pages/Oportunidades/OportunidadesKanban'
import RutasList from './pages/Rutas/RutasList'
import RutaDetail from './pages/Rutas/RutaDetail'
import VisitasList from './pages/Visitas/VisitasList'
import VentasList from './pages/Ventas/VentasList'
import VentaDetail from './pages/Ventas/VentaDetail'
import CobranzasList from './pages/Cobranzas/CobranzasList'
import CuentasList from './pages/CuentasPorCobrar/CuentasList'
import CompromisosList from './pages/Compromisos/CompromisosList'
import ReservasList from './pages/Reservas/ReservasList'
import ProductosList from './pages/Productos/ProductosList'
import Reportes from './pages/Reportes/Reportes'
import Usuarios from './pages/Admin/Usuarios'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientesList />} />
            <Route path="/clientes/:id" element={<ClienteDetail />} />
            <Route path="/oportunidades" element={<OportunidadesKanban />} />
            <Route path="/rutas" element={<RutasList />} />
            <Route path="/rutas/:id" element={<RutaDetail />} />
            <Route path="/visitas" element={<VisitasList />} />
            <Route path="/ventas" element={<VentasList />} />
            <Route path="/ventas/:id" element={<VentaDetail />} />
            <Route path="/cobranzas" element={<CobranzasList />} />
            <Route path="/cuentas-por-cobrar" element={<CuentasList />} />
            <Route path="/compromisos" element={<CompromisosList />} />
            <Route path="/reservas" element={<ReservasList />} />
            <Route path="/productos" element={<ProductosList />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Usuarios />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
