import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'
import { isNativeApp } from '../../lib/native'

/**
 * Comportamiento nativo dentro del APK (no hace nada en navegador ni PWA):
 * - Botón "atrás" de Android: vuelve a la pantalla anterior; en Inicio o Login cierra la app.
 * - Íconos de la barra de estado: claros sobre el fondo azul del login, oscuros en el resto.
 */
export function NativeBridge() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeApp) return
    let remove: (() => void) | undefined
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        const path = window.location.pathname
        if (path === '/dashboard' || path === '/login' || path === '/') {
          App.exitApp()
        } else if (window.history.length > 1) {
          navigate(-1)
        } else {
          navigate('/dashboard', { replace: true })
        }
      }).then((handle) => { remove = () => handle.remove() })
    })
    return () => remove?.()
  }, [navigate])

  useEffect(() => {
    if (!isNativeApp) return
    const style = location.pathname === '/login' ? SystemBarsStyle.Dark : SystemBarsStyle.Light
    SystemBars.setStyle({ style }).catch(() => { /* sin soporte en este equipo */ })
  }, [location.pathname])

  return null
}
