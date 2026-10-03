import { isNativeApp } from './native'

// xlsx es una librería pesada: se carga solo cuando alguien exporta un reporte.
export async function exportToExcel(filename: string, rows: Record<string, any>[], sheetName = 'Datos') {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const name = `${filename}.xlsx`

  if (!isNativeApp) {
    // Navegador / PWA: descarga normal
    XLSX.writeFile(workbook, name)
    return
  }

  // APK: el WebView de Android no descarga archivos, así que se guarda el Excel
  // en el teléfono y se abre el menú "Compartir" (WhatsApp, Gmail, Drive...).
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
  const saved = await Filesystem.writeFile({ path: name, data: base64, directory: Directory.Cache })
  await Share.share({ title: name, text: `Reporte ${filename}`, files: [saved.uri], dialogTitle: 'Enviar reporte' })
}
