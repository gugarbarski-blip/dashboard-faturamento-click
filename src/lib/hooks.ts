import { useEffect, useRef, useState } from 'react'
import type { OS } from './types'
import { tocarAlerta } from './som'

// Re-renderiza periodicamente para os cronômetros de "tempo parado" andarem sozinhos.
export function useRelogio(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function notificar(qtd: number) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification('🔔 Material pronto para coleta', {
      body: qtd === 1 ? '1 OS foi liberada para o próximo setor.' : `${qtd} OS foram liberadas para os próximos setores.`,
    })
  } catch {
    /* alguns navegadores exigem service worker; ignora */
  }
}

// Dispara som + notificação quando uma NOVA OS entra em "aguardando_coleta".
export function useAlertaColeta(ordens: OS[], somAtivo: boolean) {
  const anterior = useRef<Set<string> | null>(null)
  useEffect(() => {
    const atuais = new Set(
      ordens.filter((o) => o.estado === 'aguardando_coleta').map((o) => o.id),
    )
    if (anterior.current) {
      const novos = [...atuais].filter((id) => !anterior.current!.has(id))
      if (novos.length > 0) {
        if (somAtivo) tocarAlerta()
        notificar(novos.length)
      }
    }
    anterior.current = atuais
  }, [ordens, somAtivo])
}

// Persiste uma preferência simples no localStorage.
export function usePref(chave: string, inicial: boolean): [boolean, (v: boolean) => void] {
  const [v, setV] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(chave)
      return raw === null ? inicial : raw === '1'
    } catch {
      return inicial
    }
  })
  const set = (nv: boolean) => {
    setV(nv)
    try {
      localStorage.setItem(chave, nv ? '1' : '0')
    } catch {
      /* ignora */
    }
  }
  return [v, set]
}
