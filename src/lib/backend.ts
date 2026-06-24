import type { Snapshot, Setor, OS, Movimentacao } from './types'
import { seedSnapshot } from './seed'
import { supabase } from './supabaseClient'

// Interface comum às duas implementações (nuvem e local).
export interface Backend {
  realtime: boolean
  fetchAll(): Promise<Snapshot>
  upsertSetor(s: Setor): Promise<void>
  deleteSetor(id: string): Promise<void>
  upsertOS(o: OS): Promise<void>
  deleteOS(id: string): Promise<void>
  insertMov(m: Movimentacao): Promise<void>
  // Chama o callback sempre que algo muda (tempo real / outra aba).
  subscribe(cb: () => void): () => void
}

/* ----------------------------- Modo demonstração ---------------------------- */

const LS_KEY = 'click_producao_v1'
const EV = 'click-producao-change'

function readLS(): Snapshot {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as Snapshot
  } catch {
    /* ignora json inválido */
  }
  const seed = seedSnapshot()
  localStorage.setItem(LS_KEY, JSON.stringify(seed))
  return seed
}

function writeLS(s: Snapshot) {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
  window.dispatchEvent(new Event(EV))
}

function localBackend(): Backend {
  return {
    realtime: false,
    async fetchAll() {
      return readLS()
    },
    async upsertSetor(s) {
      const snap = readLS()
      const i = snap.setores.findIndex((x) => x.id === s.id)
      if (i >= 0) snap.setores[i] = s
      else snap.setores.push(s)
      writeLS(snap)
    },
    async deleteSetor(id) {
      const snap = readLS()
      snap.setores = snap.setores.filter((x) => x.id !== id)
      writeLS(snap)
    },
    async upsertOS(o) {
      const snap = readLS()
      const i = snap.ordens.findIndex((x) => x.id === o.id)
      if (i >= 0) snap.ordens[i] = o
      else snap.ordens.push(o)
      writeLS(snap)
    },
    async deleteOS(id) {
      const snap = readLS()
      snap.ordens = snap.ordens.filter((x) => x.id !== id)
      writeLS(snap)
    },
    async insertMov(m) {
      const snap = readLS()
      snap.movimentacoes.unshift(m)
      writeLS(snap)
    },
    subscribe(cb) {
      const h = () => cb()
      window.addEventListener('storage', h)
      window.addEventListener(EV, h)
      return () => {
        window.removeEventListener('storage', h)
        window.removeEventListener(EV, h)
      }
    },
  }
}

/* -------------------------------- Modo nuvem -------------------------------- */

function supabaseBackend(sb: NonNullable<typeof supabase>): Backend {
  return {
    realtime: true,
    async fetchAll() {
      const [se, or, mo] = await Promise.all([
        sb.from('setores').select('*').order('ordem', { ascending: true }),
        sb.from('ordens').select('*'),
        sb
          .from('movimentacoes')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(500),
      ])
      if (se.error) throw se.error
      if (or.error) throw or.error
      if (mo.error) throw mo.error
      return {
        setores: (se.data ?? []) as Setor[],
        ordens: (or.data ?? []) as OS[],
        movimentacoes: (mo.data ?? []) as Movimentacao[],
      }
    },
    async upsertSetor(s) {
      const { error } = await sb.from('setores').upsert(s)
      if (error) throw error
    },
    async deleteSetor(id) {
      const { error } = await sb.from('setores').delete().eq('id', id)
      if (error) throw error
    },
    async upsertOS(o) {
      const { error } = await sb.from('ordens').upsert(o)
      if (error) throw error
    },
    async deleteOS(id) {
      const { error } = await sb.from('ordens').delete().eq('id', id)
      if (error) throw error
    },
    async insertMov(m) {
      const { error } = await sb.from('movimentacoes').insert(m)
      if (error) throw error
    },
    subscribe(cb) {
      const ch = sb
        .channel('producao-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'setores' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'movimentacoes' }, cb)
        .subscribe()
      return () => {
        sb.removeChannel(ch)
      }
    },
  }
}

export const backend: Backend = supabase ? supabaseBackend(supabase) : localBackend()
