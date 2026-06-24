import { useMemo } from 'react'
import type { OS } from '../lib/types'
import { useStore } from '../lib/store'
import { diasAte, formatData } from '../lib/format'
import { Botao } from './ui'

function rotuloDias(dias: number | null): { texto: string; classe: string } {
  if (dias === null) return { texto: 'sem data', classe: 'text-muted' }
  if (dias < 0) return { texto: `atrasada (${Math.abs(dias)}d)`, classe: 'text-crit' }
  if (dias === 0) return { texto: 'entra hoje', classe: 'text-warn font-bold' }
  if (dias === 1) return { texto: 'entra amanhã', classe: 'text-accent' }
  return { texto: `em ${dias} dias`, classe: 'text-muted' }
}

export function Agendadas({ onAbrir }: { onAbrir: (os: OS) => void }) {
  const { ordens, iniciarAgendada } = useStore()

  const lista = useMemo(
    () =>
      ordens
        .filter((o) => o.estado === 'agendada')
        .sort((a, b) => (a.data_entrada_prevista ?? '9999').localeCompare(b.data_entrada_prevista ?? '9999')),
    [ordens],
  )

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">📅 Agendadas — entram nos próximos dias</h2>
        <p className="text-sm text-muted">Trabalhos cadastrados que ainda não entraram na produção.</p>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted">
          <div className="mb-2 text-3xl">📭</div>
          Nenhuma OS agendada. Cadastre uma OS com data futura para vê-la aqui.
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((os) => {
            const dias = diasAte(os.data_entrada_prevista)
            const r = rotuloDias(dias)
            return (
              <div
                key={os.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-bg text-center leading-tight">
                  <span className="text-base font-bold">{formatData(os.data_entrada_prevista) || '—'}</span>
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onAbrir(os)}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">OS {os.numero_os}</span>
                    {os.prioridade === 'urgente' && (
                      <span className="rounded-full bg-crit/20 px-1.5 py-0.5 text-[10px] font-bold text-crit">⚠️</span>
                    )}
                    <span className={`text-xs ${r.classe}`}>• {r.texto}</span>
                  </div>
                  <div className="truncate text-sm text-muted">
                    {os.cliente || 'Sem cliente'} {os.descricao ? `— ${os.descricao}` : ''}
                  </div>
                </div>
                <Botao variante="primario" onClick={() => iniciarAgendada(os)}>
                  ▶️ Iniciar
                </Botao>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
