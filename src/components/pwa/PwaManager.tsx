import React, { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { isNativeApp } from '../../lib/native'

// Evento que Chrome/Android dispara cuando la app se puede instalar
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'crm-install-dismissed-at'
const DISMISS_DAYS = 7

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iPhone
    (window.navigator as any).standalone === true
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/**
 * Tres avisos para el uso en terreno:
 * 1. Sin conexión: avisa que los cambios no se guardarán hasta recuperar señal.
 * 2. Nueva versión: permite actualizar cuando el vendedor quiera.
 * 3. Instalar: invita a instalar la app en el teléfono.
 */
export function PwaManager() {
  const [online, setOnline] = useState(navigator.onLine)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [hideInstall, setHideInstall] = useState(recentlyDismissed())

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Revisa si hay versión nueva cada hora (el vendedor puede tener la app abierta todo el día)
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstallEvent(null)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    if (isIos() && !isStandalone()) setShowIosHint(true)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismissInstall() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* sin almacenamiento */ }
    setHideInstall(true)
  }

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  // Dentro del APK ya es una app instalada: no se ofrece instalar
  const canOfferInstall = !isNativeApp && !hideInstall && !isStandalone() && (installEvent || showIosHint)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-3"
      style={{ paddingTop: 'calc(var(--sat) + 0.5rem)' }}
      aria-live="polite"
    >
      {!online && (
        <div className="pointer-events-auto w-full max-w-md rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-lg">
          Sin conexión. Lo que registres ahora no se guardará hasta que vuelva la señal.
        </div>
      )}

      {needRefresh && (
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-lg bg-navy-900 px-4 py-3 text-sm text-white shadow-lg">
          <span>Hay una versión nueva del CRM.</span>
          <div className="flex shrink-0 gap-2">
            <button className="text-slate-300" onClick={() => setNeedRefresh(false)}>Luego</button>
            <button className="btn btn-primary px-3 py-1.5" onClick={() => updateServiceWorker(true)}>Actualizar</button>
          </div>
        </div>
      )}

      {canOfferInstall && !needRefresh && (
        <div className="pointer-events-auto w-full max-w-md rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy-900 shadow-lg">
          <div className="flex items-start gap-3">
            <img src="/pwa-192x192.png" alt="" className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <p className="font-semibold">Instala CRM Campo en tu teléfono</p>
              {installEvent ? (
                <p className="text-slate-500">Se abre como app, sin barra del navegador y más rápido.</p>
              ) : (
                <p className="text-slate-500">En Safari toca el botón Compartir y luego «Agregar a inicio».</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn btn-secondary px-3 py-1.5" onClick={dismissInstall}>Ahora no</button>
            {installEvent && (
              <button className="btn btn-primary px-3 py-1.5" onClick={install}>Instalar</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
