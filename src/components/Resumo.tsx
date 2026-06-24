import { useMemo } from 'react'
import type { OS } from '../lib/types'
import { useStore } from '../lib/store'
import { useRelogio } from '../lib/hooks'
import { duracaoMs, formatDuracao, nivelTempo, hojeISO, diasAte } from '../lib/format'

function Cartao({
  titulo,
  valor,
  emoji,
  cor,
}: {
  titulo: string
  valor: number
  emoji: string
  cor: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{titulo}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="mt-1 text-3xl font-extrabold" style={{ color: cor }}>
        {valor}
      </div>
    </div>
  )
}

export function Resumo({ onAbrir }: { onAbrir: (os: OS) => void }) {
  const { ordens, setoresAtivos, nomeSetor, corSetor } = useStore()
  const now = useRelogio(20_000)
  const hoje = hojeISO()

  const m = useMemo(() => {
    const emProcesso = ordens.filter((o) => o.estado === 'em_processo')
    const aguardando = ordens.filter((o) => o.estado === 'aguardando_coleta')
    const agendadas = ordens.filter((o) => o.estado === 'agendada')
    const concluidasHoje = ordens.filter(
      (o) => o.estado === 'concluida' && o.concluida_em?.slice(0, 10) === hoje,
    )
    const proximos7 = agendadas.filter((o) => {
      const d = diasAte(o.data_entrada_prevista)
      return d !== null && d >= 0 && d <= 7
    })
    const paradas = [...aguardando].sort(
      (a, b) => new Date(a.desde).getTime() - new Date(b.desde).getTime(),
    )
    return { emProcesso, aguardando, agendadas, concluidasHoje, proximos7, paradas }
  }, [ordens, hoje])

  const porSetor = setoresAtivos.map((s) => ({
    setor: s,
    qtd: ordens.filter(
      (o) =>
        o.setor_atual_id === s.id &&
        (o.estado === 'em_processo' || o.estado === 'aguardando_coleta'),
    ).length,
  }))
  const maxSetor = Math.max(1, ...porSetor.map((x) => x.qtd))

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <h2 className="text-xl font-bold">📊 Resumo da produção</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao titulo="Em processo" valor={m.emProcesso.length} emoji="⚙️" cor="#f5a623" />
        <Cartao titulo="Aguardando coleta" valor={m.aguardando.length} emoji="🔔" cor="#f1c40f" />
        <Cartao titulo="Entram em 7 dias" valor={m.proximos7.length} emoji="📅" cor="#4f8ef7" />
        <Cartao titulo="Concluídas hoje" valor={m.concluidasHoje.length} emoji="✅" cor="#2ecc71" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Paradas há mais tempo */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-bold">⏱️ Aguardando coleta há mais tempo</h3>
          {m.paradas.length === 0 ? (
            <p className="text-sm text-muted">Nada aguardando coleta. 🎉</p>
          ) : (
            <div className="space-y-2">
              {m.paradas.slice(0, 6).map((os) => {
                const ms = duracaoMs(os.desde, now)
                const nivel = nivelTempo(ms)
                const cor = nivel === 'critico' ? '#e74c3c' : nivel === 'atencao' ? '#f1c40f' : '#8892a4'
                return (
                  <button
                    key={os.id}
                    onClick={() => onAbrir(os)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-bg/40 px-3 py-2 text-left hover:border-accent/50"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold">OS {os.numero_os}</div>
                      <div className="truncate text-xs text-muted">
                        {nomeSetor(os.setor_atual_id)} • {os.cliente || 'sem cliente'}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold" style={{ color: cor }}>
                      {formatDuracao(ms)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Carga por setor */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-bold">🏭 Carga por setor</h3>
          {porSetor.length === 0 ? (
            <p className="text-sm text-muted">Nenhum setor ativo.</p>
          ) : (
            <div className="space-y-3">
              {porSetor.map(({ setor, qtd }) => (
                <div key={setor.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: setor.cor }} />
                      {setor.nome}
                    </span>
                    <span className="font-semibold">{qtd}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(qtd / maxSetor) * 100}%`, background: setor.cor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concluídas hoje */}
      {m.concluidasHoje.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-bold">✅ Concluídas hoje</h3>
          <div className="flex flex-wrap gap-2">
            {m.concluidasHoje.map((os) => (
              <button
                key={os.id}
                onClick={() => onAbrir(os)}
                className="rounded-lg border border-ok/30 bg-ok/10 px-3 py-1.5 text-sm hover:border-ok"
              >
                OS {os.numero_os} <span className="text-muted">— {nomeSetor(os.setor_atual_id)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
