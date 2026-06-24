import { useEffect, useState } from 'react'
import type { OS } from './lib/types'
import { useStore } from './lib/store'
import { useAlertaColeta, usePref } from './lib/hooks'
import { destravarAudio } from './lib/som'
import { Esteira } from './components/Esteira'
import { Agendadas } from './components/Agendadas'
import { Resumo } from './components/Resumo'
import { ConfigSetores } from './components/ConfigSetores'
import { ModalNovaOS } from './components/ModalNovaOS'
import { ModalDetalheOS } from './components/ModalDetalheOS'
import { Botao } from './components/ui'

type View = 'esteira' | 'agendadas' | 'resumo' | 'setores'

export default function App() {
  const store = useStore()
  const [view, setView] = useState<View>('esteira')
  const [novaOS, setNovaOS] = useState(false)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [som, setSom] = usePref('click_som', true)

  useAlertaColeta(store.ordens, som)

  // Libera o áudio no primeiro toque/clique (exigência dos navegadores).
  useEffect(() => {
    const h = () => destravarAudio()
    window.addEventListener('pointerdown', h, { once: true })
    return () => window.removeEventListener('pointerdown', h)
  }, [])

  const abrir = (os: OS) => setDetalheId(os.id)

  const nAguardando = store.ordens.filter((o) => o.estado === 'aguardando_coleta').length
  const nAgendadas = store.ordens.filter((o) => o.estado === 'agendada').length

  const tabs: Array<{ id: View; label: string; emoji: string; badge?: number }> = [
    { id: 'esteira', label: 'Esteira', emoji: '🏭', badge: nAguardando },
    { id: 'agendadas', label: 'Agendadas', emoji: '📅', badge: nAgendadas },
    { id: 'resumo', label: 'Resumo', emoji: '📊' },
    { id: 'setores', label: 'Setores', emoji: '⚙️' },
  ]

  const toggleSom = () => {
    const novo = !som
    setSom(novo)
    if (novo) {
      destravarAudio()
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void Notification.requestPermission()
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho */}
      <header className="border-b border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏭</span>
            <div>
              <h1 className="text-lg font-extrabold leading-tight text-accent">Controle de Produção</h1>
              <span className="text-xs text-muted">Click Impresso</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="hidden items-center gap-1 rounded-full border border-border px-2 py-1 text-xs sm:flex"
              title={store.realtime ? 'Conectado ao banco em tempo real' : 'Modo demonstração: dados salvos só neste navegador'}
            >
              {store.realtime ? '🟢 Tempo real' : '🟡 Demonstração'}
            </span>
            <button
              onClick={toggleSom}
              className="rounded-lg border border-border bg-card2 px-2.5 py-2 text-sm hover:border-accent/60"
              title={som ? 'Som de alerta ligado' : 'Som de alerta desligado'}
            >
              {som ? '🔔' : '🔕'}
            </button>
            <Botao variante="primario" onClick={() => setNovaOS(true)}>
              ➕ Nova OS
            </Botao>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 scroll-thin">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                view === t.id ? 'bg-accent text-black' : 'text-muted hover:bg-card2 hover:text-ink'
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
              {t.badge ? (
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-xs ${
                    view === t.id ? 'bg-black/20' : 'bg-warn/20 text-warn'
                  }`}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      {/* Banner modo demonstração */}
      {!store.realtime && (
        <div className="bg-accent-2/10 px-4 py-1.5 text-center text-xs text-accent-2">
          Modo demonstração — os dados ficam só neste navegador. Conecte o Supabase para compartilhar entre setores em
          tempo real.
        </div>
      )}
      {store.erro && (
        <div className="bg-crit/10 px-4 py-1.5 text-center text-xs text-crit">⚠️ {store.erro}</div>
      )}

      {/* Conteúdo */}
      <main className="min-h-0 flex-1">
        {store.loading ? (
          <div className="grid h-full place-items-center text-muted">Carregando…</div>
        ) : view === 'esteira' ? (
          <Esteira onAbrir={abrir} />
        ) : view === 'agendadas' ? (
          <Agendadas onAbrir={abrir} />
        ) : view === 'resumo' ? (
          <Resumo onAbrir={abrir} />
        ) : (
          <ConfigSetores />
        )}
      </main>

      <ModalNovaOS open={novaOS} onClose={() => setNovaOS(false)} />
      <ModalDetalheOS osId={detalheId} onClose={() => setDetalheId(null)} />
    </div>
  )
}
