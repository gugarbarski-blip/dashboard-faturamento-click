import type { OS } from '../lib/types'
import { useStore } from '../lib/store'
import { duracaoMs, formatDuracao, nivelTempo, formatData, diasAte } from '../lib/format'
import { Botao } from './ui'

const corNivel: Record<string, string> = {
  ok: 'text-muted',
  atencao: 'text-warn',
  critico: 'text-crit',
}

export function CartaoOS({
  os,
  now,
  onAbrir,
}: {
  os: OS
  now: number
  onAbrir: (os: OS) => void
}) {
  const { liberar, coletar, concluir, proximoSetor } = useStore()
  const aguardando = os.estado === 'aguardando_coleta'
  const ms = duracaoMs(os.desde, now)
  const nivel = nivelTempo(ms)
  const prox = proximoSetor(os.setor_atual_id)
  const dias = diasAte(os.prazo)

  return (
    <div
      onClick={() => onAbrir(os)}
      className={`entrada cursor-pointer rounded-xl border bg-card2 p-3 shadow-sm transition hover:border-accent/50 ${
        aguardando ? 'pulso-alerta border-warn/60' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight">OS {os.numero_os}</span>
            {os.prioridade === 'urgente' && (
              <span className="rounded-full bg-crit/20 px-1.5 py-0.5 text-[10px] font-bold text-crit">
                ⚠️ URGENTE
              </span>
            )}
          </div>
          {os.cliente && <div className="truncate text-sm text-ink">{os.cliente}</div>}
        </div>
        <span className="shrink-0 text-lg">{aguardando ? '🔔' : '⚙️'}</span>
      </div>

      {os.descricao && <div className="mt-1 line-clamp-2 text-xs text-muted">{os.descricao}</div>}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={`font-semibold ${corNivel[nivel]}`}>
          ⏱️ {aguardando ? 'parada há ' : 'há '}
          {formatDuracao(ms)}
        </span>
        {os.prazo && (
          <span className={dias !== null && dias < 0 ? 'font-semibold text-crit' : 'text-muted'}>
            📦 {dias !== null && dias < 0 ? `atrasada (${formatData(os.prazo)})` : `entrega ${formatData(os.prazo)}`}
          </span>
        )}
      </div>

      {os.observacoes && (
        <div className="mt-2 rounded-lg bg-bg/60 px-2 py-1 text-xs text-muted">
          📝 <span className="line-clamp-2 align-middle">{os.observacoes}</span>
        </div>
      )}

      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {aguardando ? (
          <Botao variante="primario" className="flex-1" onClick={() => coletar(os)}>
            ⬇️ Coletar aqui
          </Botao>
        ) : prox ? (
          <Botao variante="sucesso" className="flex-1" onClick={() => liberar(os)}>
            ▶️ Liberar p/ {prox.nome}
          </Botao>
        ) : (
          <Botao variante="sucesso" className="flex-1" onClick={() => concluir(os)}>
            ✅ Concluir
          </Botao>
        )}
      </div>
    </div>
  )
}
