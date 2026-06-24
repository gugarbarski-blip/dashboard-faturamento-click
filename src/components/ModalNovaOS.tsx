import { useState } from 'react'
import type { NovaOSInput, Prioridade } from '../lib/types'
import { useStore } from '../lib/store'
import { Modal, Campo, inputCls, Botao } from './ui'

const vazio: NovaOSInput = {
  numero_os: '',
  cliente: '',
  descricao: '',
  prioridade: 'normal',
  prazo: '',
  data_entrada_prevista: '',
  observacoes: '',
}

export function ModalNovaOS({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { criarOS, setoresAtivos } = useStore()
  const [form, setForm] = useState<NovaOSInput>(vazio)
  const [salvando, setSalvando] = useState(false)

  const set = <K extends keyof NovaOSInput>(k: K, v: NovaOSInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const agendada = !!form.data_entrada_prevista && form.data_entrada_prevista > new Date().toISOString().slice(0, 10)
  const primeiro = setoresAtivos[0]

  async function salvar() {
    if (!form.numero_os.trim() || salvando) return
    setSalvando(true)
    try {
      await criarOS(form)
      setForm(vazio)
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} titulo="➕ Nova OS">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Número da OS *">
            <input
              autoFocus
              className={inputCls}
              value={form.numero_os}
              onChange={(e) => set('numero_os', e.target.value)}
              placeholder="Ex.: 1045"
            />
          </Campo>
          <Campo label="Prioridade">
            <div className="flex gap-2">
              {(['normal', 'urgente'] as Prioridade[]).map((p) => (
                <button
                  key={p}
                  onClick={() => set('prioridade', p)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${
                    form.prioridade === p
                      ? p === 'urgente'
                        ? 'border-crit bg-crit/15 text-crit'
                        : 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg text-muted'
                  }`}
                >
                  {p === 'urgente' ? '⚠️ Urgente' : 'Normal'}
                </button>
              ))}
            </div>
          </Campo>
        </div>

        <Campo label="Cliente">
          <input
            className={inputCls}
            value={form.cliente}
            onChange={(e) => set('cliente', e.target.value)}
            placeholder="Nome do cliente"
          />
        </Campo>

        <Campo label="Descrição do trabalho">
          <textarea
            className={`${inputCls} min-h-[64px] resize-y`}
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            placeholder="Ex.: 500 panfletos A5 4x4, couché 150g"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Prazo de entrega" dica="Quando precisa ficar pronto">
            <input
              type="date"
              className={inputCls}
              value={form.prazo}
              onChange={(e) => set('prazo', e.target.value)}
            />
          </Campo>
          <Campo label="Entra na produção em" dica="Deixe em branco para já">
            <input
              type="date"
              className={inputCls}
              value={form.data_entrada_prevista}
              onChange={(e) => set('data_entrada_prevista', e.target.value)}
            />
          </Campo>
        </div>

        <Campo label="Observações">
          <textarea
            className={`${inputCls} min-h-[48px] resize-y`}
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Alguma instrução especial?"
          />
        </Campo>

        <div className="rounded-lg bg-bg/60 px-3 py-2 text-xs text-muted">
          {agendada ? (
            <>📅 Esta OS vai ficar em <b>Agendadas</b> até a data escolhida.</>
          ) : primeiro ? (
            <>⚙️ Esta OS vai entrar direto em <b>{primeiro.nome}</b>.</>
          ) : (
            <>⚠️ Não há setores ativos — a OS ficará em Agendadas até você criar um setor.</>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Botao variante="fantasma" onClick={onClose}>
            Cancelar
          </Botao>
          <Botao variante="primario" onClick={salvar} disabled={!form.numero_os.trim() || salvando}>
            {salvando ? 'Salvando…' : 'Cadastrar OS'}
          </Botao>
        </div>
      </div>
    </Modal>
  )
}
