import { useMemo, useState } from 'react'
import type { AcaoMov, OS } from '../lib/types'
import { useStore } from '../lib/store'
import { duracaoMs, formatDuracao, formatData } from '../lib/format'
import { Modal, EstadoBadge, Botao, inputCls } from './ui'

const acaoMeta: Record<AcaoMov, { emoji: string; texto: string }> = {
  cadastro: { emoji: '🆕', texto: 'Cadastrada' },
  iniciou: { emoji: '▶️', texto: 'Entrou na produção' },
  liberou: { emoji: '📤', texto: 'Liberada' },
  coletou: { emoji: '📥', texto: 'Coletada' },
  concluiu: { emoji: '✅', texto: 'Concluída' },
  observacao: { emoji: '📝', texto: 'Observação' },
  reabriu: { emoji: '↩️', texto: 'Reaberta' },
  editou: { emoji: '✏️', texto: 'Editada' },
  moveu: { emoji: '↔️', texto: 'Movida' },
}

function dataHora(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function ModalDetalheOS({ osId, onClose }: { osId: string | null; onClose: () => void }) {
  const store = useStore()
  const os: OS | undefined = store.ordens.find((o) => o.id === osId)
  const [obs, setObs] = useState('')
  const [editandoObs, setEditandoObs] = useState(false)

  const historico = useMemo(
    () => store.movimentacoes.filter((m) => m.os_id === osId),
    [store.movimentacoes, osId],
  )

  if (!os) return null

  const prox = store.proximoSetor(os.setor_atual_id)
  const ms = duracaoMs(os.desde)

  const iniciarEdicaoObs = () => {
    setObs(os.observacoes ?? '')
    setEditandoObs(true)
  }
  const salvarObs = async () => {
    await store.salvarObservacao(os, obs)
    setEditandoObs(false)
  }

  return (
    <Modal
      open={!!osId}
      onClose={onClose}
      largura="max-w-2xl"
      titulo={
        <span className="flex items-center gap-2">
          OS {os.numero_os} <EstadoBadge estado={os.estado} />
          {os.prioridade === 'urgente' && (
            <span className="rounded-full bg-crit/20 px-2 py-0.5 text-xs font-bold text-crit">⚠️ Urgente</span>
          )}
        </span>
      }
    >
      <div className="space-y-5">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info rotulo="Cliente" valor={os.cliente ?? '—'} />
          <Info rotulo="Setor atual" valor={store.nomeSetor(os.setor_atual_id)} />
          <Info rotulo="Tempo no estado" valor={formatDuracao(ms)} />
          <Info rotulo="Prazo" valor={os.prazo ? formatData(os.prazo) : '—'} />
        </div>
        {os.descricao && (
          <div className="rounded-lg border border-border bg-bg/50 p-3 text-sm">{os.descricao}</div>
        )}

        {/* Ações principais */}
        <div className="flex flex-wrap gap-2">
          {os.estado === 'agendada' && (
            <Botao variante="primario" onClick={() => store.iniciarAgendada(os)}>
              ▶️ Iniciar produção
            </Botao>
          )}
          {os.estado === 'aguardando_coleta' && (
            <Botao variante="primario" onClick={() => store.coletar(os)}>
              ⬇️ Coletar aqui
            </Botao>
          )}
          {os.estado === 'em_processo' &&
            (prox ? (
              <Botao variante="sucesso" onClick={() => store.liberar(os)}>
                ▶️ Liberar p/ {prox.nome}
              </Botao>
            ) : (
              <Botao variante="sucesso" onClick={() => store.concluir(os)}>
                ✅ Concluir
              </Botao>
            ))}
          {os.estado !== 'concluida' && os.estado !== 'agendada' && (
            <Botao variante="secundario" onClick={() => store.concluir(os)}>
              ✅ Concluir
            </Botao>
          )}
          {os.estado === 'concluida' && (
            <Botao variante="secundario" onClick={() => store.reabrir(os)}>
              ↩️ Reabrir
            </Botao>
          )}
        </div>

        {/* Mover para setor específico */}
        {os.estado !== 'concluida' && os.estado !== 'agendada' && store.setoresAtivos.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            ↔️ Mover para:
            <select
              className={`${inputCls} max-w-[12rem]`}
              value={os.setor_atual_id ?? ''}
              onChange={(e) => store.moverPara(os, e.target.value)}
            >
              {store.setoresAtivos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Observações */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold">📝 Observações</span>
            {!editandoObs && (
              <Botao variante="fantasma" onClick={iniciarEdicaoObs} className="text-xs">
                {os.observacoes ? 'Editar' : 'Adicionar'}
              </Botao>
            )}
          </div>
          {editandoObs ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                className={`${inputCls} min-h-[64px] resize-y`}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Botao variante="fantasma" onClick={() => setEditandoObs(false)}>
                  Cancelar
                </Botao>
                <Botao variante="primario" onClick={salvarObs}>
                  Salvar
                </Botao>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-bg/50 p-3 text-sm text-muted">
              {os.observacoes || 'Sem observações.'}
            </div>
          )}
        </div>

        {/* Histórico */}
        <div>
          <div className="mb-2 text-sm font-semibold">🕘 Histórico</div>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1 scroll-thin">
            {historico.length === 0 ? (
              <div className="text-sm text-muted">Sem movimentações ainda.</div>
            ) : (
              historico.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">{acaoMeta[m.acao].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{acaoMeta[m.acao].texto}</span>
                      <span className="shrink-0 text-xs text-muted">{dataHora(m.criado_em)}</span>
                    </div>
                    {m.detalhe && <div className="truncate text-xs text-muted">{m.detalhe}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Excluir */}
        <div className="flex justify-end border-t border-border pt-3">
          <Botao
            variante="perigo"
            onClick={() => {
              if (confirm(`Excluir a OS ${os.numero_os}? Esta ação não pode ser desfeita.`)) {
                store.excluirOS(os)
                onClose()
              }
            }}
          >
            🗑️ Excluir OS
          </Botao>
        </div>
      </div>
    </Modal>
  )
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-bg/50 px-3 py-2">
      <div className="text-xs text-muted">{rotulo}</div>
      <div className="truncate font-semibold">{valor}</div>
    </div>
  )
}
