import { useEffect, type ReactNode } from 'react'
import type { Estado } from '../lib/types'

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  titulo,
  children,
  largura = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  titulo: ReactNode
  children: ReactNode
  largura?: string
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`entrada mt-6 mb-10 w-full ${largura} rounded-2xl border border-border bg-card shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-card2 hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* --------------------------------- Estado ---------------------------------- */

export const estadoMeta: Record<Estado, { label: string; emoji: string; classe: string }> = {
  agendada: { label: 'Agendada', emoji: '📅', classe: 'bg-accent-2/15 text-accent-2 border-accent-2/30' },
  em_processo: { label: 'Em processo', emoji: '⚙️', classe: 'bg-accent/15 text-accent border-accent/30' },
  aguardando_coleta: { label: 'Aguardando coleta', emoji: '🔔', classe: 'bg-warn/15 text-warn border-warn/40' },
  concluida: { label: 'Concluída', emoji: '✅', classe: 'bg-ok/15 text-ok border-ok/30' },
}

export function EstadoBadge({ estado }: { estado: Estado }) {
  const m = estadoMeta[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${m.classe}`}>
      <span>{m.emoji}</span>
      {m.label}
    </span>
  )
}

/* ------------------------------ Campos de form ----------------------------- */

export function Campo({
  label,
  children,
  dica,
}: {
  label: string
  children: ReactNode
  dica?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-muted">{dica}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-ink outline-none placeholder:text-muted focus:border-accent'

export function Botao({
  children,
  onClick,
  variante = 'secundario',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variante?: 'primario' | 'secundario' | 'perigo' | 'sucesso' | 'fantasma'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
  const variantes: Record<string, string> = {
    primario: 'bg-accent text-black hover:brightness-110',
    sucesso: 'bg-ok text-black hover:brightness-110',
    perigo: 'bg-crit/90 text-white hover:bg-crit',
    secundario: 'border border-border bg-card2 text-ink hover:border-accent/60',
    fantasma: 'text-muted hover:bg-card2 hover:text-ink',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variantes[variante]} ${className}`}>
      {children}
    </button>
  )
}
