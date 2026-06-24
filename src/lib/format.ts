// Helpers de tempo e formatação.

export function agora(): string {
  return new Date().toISOString()
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function duracaoMs(desde: string, ate: number = Date.now()): number {
  return Math.max(0, ate - new Date(desde).getTime())
}

// "2d 3h", "3h 20min", "15min", "agora"
export function formatDuracao(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 1) return 'agora há pouco'
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

// Limites (em horas) para destacar OS paradas há muito tempo.
export const LIMITE_ATENCAO_H = 1
export const LIMITE_CRITICO_H = 4

export type Nivel = 'ok' | 'atencao' | 'critico'

export function nivelTempo(ms: number): Nivel {
  const h = ms / 3_600_000
  if (h >= LIMITE_CRITICO_H) return 'critico'
  if (h >= LIMITE_ATENCAO_H) return 'atencao'
  return 'ok'
}

// Formata yyyy-mm-dd -> dd/mm
export function formatData(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}`
}

export function hojeISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

// Quantos dias faltam (negativo = atrasado) a partir de uma data yyyy-mm-dd.
export function diasAte(iso: string | null): number | null {
  if (!iso) return null
  const alvo = new Date(iso + 'T00:00:00')
  const h = new Date(hojeISO() + 'T00:00:00')
  return Math.round((alvo.getTime() - h.getTime()) / 86_400_000)
}
