import { useState } from 'react'
import { useStore } from '../lib/store'
import { Botao, inputCls } from './ui'

const CORES = ['#4f8ef7', '#f5a623', '#9b59b6', '#2ecc71', '#e74c3c', '#1abc9c', '#e67e22', '#f1c40f']

export function ConfigSetores() {
  const { setores, ordens, addSetor, editarSetor, moverSetor, removerSetor } = useStore()
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES[0])

  const adicionar = async () => {
    if (!nome.trim()) return
    await addSetor(nome, cor)
    setNome('')
    setCor(CORES[(setores.length + 1) % CORES.length])
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <div>
        <h2 className="text-xl font-bold">🏭 Setores da produção</h2>
        <p className="text-sm text-muted">
          As colunas da esteira seguem esta ordem. Arraste a prioridade com as setas. Um setor com OS dentro é
          apenas <b>desativado</b> (não some o histórico).
        </p>
      </div>

      {/* Adicionar */}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-4">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium">Novo setor</span>
          <input
            className={inputCls}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            placeholder="Ex.: Corte e vinco"
          />
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium">Cor</span>
          <div className="flex gap-1">
            {CORES.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`h-8 w-8 rounded-lg border-2 ${cor === c ? 'border-ink' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        <Botao variante="primario" onClick={adicionar} disabled={!nome.trim()}>
          ➕ Adicionar
        </Botao>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {setores.map((s, i) => {
          const qtd = ordens.filter((o) => o.setor_atual_id === s.id).length
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 ${
                s.ativo ? '' : 'opacity-50'
              }`}
            >
              <div className="flex flex-col">
                <button
                  onClick={() => moverSetor(s, -1)}
                  disabled={i === 0}
                  className="text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  onClick={() => moverSetor(s, 1)}
                  disabled={i === setores.length - 1}
                  className="text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Descer"
                >
                  ▼
                </button>
              </div>

              <input
                type="color"
                value={s.cor}
                onChange={(e) => editarSetor(s, { cor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                aria-label="Cor do setor"
              />

              <input
                className={`${inputCls} flex-1`}
                value={s.nome}
                onChange={(e) => editarSetor(s, { nome: e.target.value })}
              />

              <span className="hidden w-20 text-center text-xs text-muted sm:block">{qtd} OS</span>

              <Botao variante="secundario" onClick={() => editarSetor(s, { ativo: !s.ativo })}>
                {s.ativo ? '👁️ Ativo' : '🚫 Inativo'}
              </Botao>

              <Botao
                variante="fantasma"
                onClick={() => {
                  const aviso =
                    qtd > 0
                      ? `O setor "${s.nome}" tem ${qtd} OS. Ele será desativado (mantém histórico). Continuar?`
                      : `Remover o setor "${s.nome}"?`
                  if (confirm(aviso)) removerSetor(s)
                }}
                aria-label="Remover"
              >
                🗑️
              </Botao>
            </div>
          )
        })}
        {setores.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted">
            Nenhum setor ainda. Adicione o primeiro acima. 👆
          </div>
        )}
      </div>
    </div>
  )
}
