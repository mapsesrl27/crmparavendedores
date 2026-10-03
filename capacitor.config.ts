import type { CapacitorConfig } from '@capacitor/cli'

// URL de tu CRM en Netlify. En GitHub Actions viene de la variable APP_URL.
// Si está definida, el APK abre el CRM desde Netlify: cada deploy llega
// a los teléfonos sin reinstalar el APK.
// Si no está, el APK usa la copia del CRM que va empaquetada adentro.
const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, '')

const config: CapacitorConfig = {
  appId: 'com.mapse.crmcampo',
  appName: 'CRM Campo',
  webDir: 'dist',
  server: appUrl
    ? { url: appUrl, cleartext: false, androidScheme: 'https' }
    : { androidScheme: 'https' },
  android: {
    backgroundColor: '#0E1B33',
  },
  plugins: {
    SystemBars: {
      // Inyecta --safe-area-inset-* con los márgenes correctos de la barra de estado
      // y la barra de gestos (soluciona un bug de WebView antiguos en Android).
      insetsHandling: 'css',
      style: 'LIGHT',
    },
  },
}

export default config
