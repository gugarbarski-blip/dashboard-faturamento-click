import { useMemo } from 'react'
import type { OS, Setor } from '../lib/types'
import { useStore } from '../lib/store'
import { useRelogio } from '../lib/hooks'
import { CartaoOS } from './CartaoOS'

function ordenar(a: OS, b: OS): number {
  // 1) aguardando coleta primeiro  2) urgente primeiro  3) mais antiga primeiro
  const peso = (o: OS) => (o.estado === 'aguardando_coleta' ? 0 : 1)
  if (peso(a) !== peso(b)) return peso(a) - peso(b)
  if (a.prioridade !== b.prioridade) return a.prioridade === 'urgente' ? -1 : 1
  return new Date(a.desde).getTime() - new Date(b.desde).getTime()
}

function Coluna({
  setor,
  ordens,
  now,
  onAbrir,
}: {
  setor: Setor
  ordens: OS[]
  now: number
  onAbrir: (os: OS) => void
}) {
  const aguardando = ordens.filter((o) => o.estado === 'aguardando_coleta').length
  return (
    <div className="flex h-full w-[19rem] shrink-0 flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: setor.cor }} />
          <span className="truncate font-bold">{setor.nome}</span>
          <span className="rounded-full bg-card2 px-2 py-0.5 text-xs text-muted">{ordens.length}</span>
        </div>
        {aguardando > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-xs font-bold text-warn">
            <span className="sino">🔔</span>
            {aguardando}
          </span>
        )}
      </div>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
        {ordens.length === 0 ? (
          <div className="mt-6 text-center text-sm text-muted">
            <div className="mb-1 text-2xl">✨</div>
            Nada por aqui
          </div>
        ) : (
          ordens.map((os) => <CartaoOS key={os.id} os={os} now={now} onAbrir={onAbrir} />)
        )}
      </div>
    </div>
  )
}

export function Esteira({ onAbrir }: { onAbrir: (os: OS) => void }) {
  const { setoresAtivos, ordens } = useStore()
  const now = useRelogio(20_000)

  const porSetor = useMemo(() => {
    const map = new Map<string, OS[]>()
    for (const s of setoresAtivos) map.set(s.id, [])
    for (const o of ordens) {
      if (o.estado !== 'em_processo' && o.estado !== 'aguardando_coleta') continue
      if (!o.setor_atual_id || !map.has(o.setor_atual_id)) continue
      map.get(o.setor_atual_id)!.push(o)
    }
    for (const lista of map.values()) lista.sort(ordenar)
    return map
  }, [setoresAtivos, ordens])

  if (setoresAtivos.length === 0) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-muted">
        <div>
          <div className="mb-2 text-4xl">🏭</div>
          <p className="mb-1 text-lg font-semibold text-ink">Nenhum setor configurado</p>
          <p className="text-sm">Vá em “Setores” no menu para criar as etapas da sua produção.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-thin flex h-full gap-4 overflow-x-auto px-4 pb-4 pt-2">
      {setoresAtivos.map((s) => (
        <Coluna key={s.id} setor={s} ordens={porSetor.get(s.id) ?? []} now={now} onAbrir={onAbrir} />
      ))}
    </div>
  )
}
