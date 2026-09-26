import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="text-2xl font-bold text-navy-900">Página no encontrada</p>
      <Link to="/dashboard" className="btn btn-primary">Volver al inicio</Link>
    </div>
  )
}
