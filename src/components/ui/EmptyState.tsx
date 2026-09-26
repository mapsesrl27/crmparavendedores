export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-8 text-center text-slate-500">
      <p className="font-semibold text-navy-800">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
    </div>
  )
}
