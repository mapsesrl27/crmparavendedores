export function Badge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  return <span className={`badge badge-${key}`}>{status}</span>
}
