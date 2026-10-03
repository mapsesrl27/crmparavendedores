import { Capacitor } from '@capacitor/core'

/** true cuando el CRM corre dentro del APK (Capacitor), false en el navegador o la PWA */
export const isNativeApp = Capacitor.isNativePlatform()
