// xlsx es una librería pesada: se carga solo cuando alguien exporta un reporte,
// así la app abre más rápido en el teléfono.
export async function exportToExcel(filename: string, rows: Record<string, any>[], sheetName = 'Datos') {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
