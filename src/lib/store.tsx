import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AcaoMov, Movimentacao, NovaOSInput, OS, Setor, Snapshot } from './types'
import { agora, novoId, hojeISO } from './format'
import { backend } from './backend'

interface StoreCtx {
  loading: boolean
  realtime: boolean
  erro: string | null
  setores: Setor[] // todos (inclui inativos), ordenados
  setoresAtivos: Setor[] // só ativos, ordenados
  ordens: OS[]
  movimentacoes: Movimentacao[]
  nomeSetor: (id: string | null) => string
  corSetor: (id: string | null) => string
  proximoSetor: (id: string | null) => Setor | null
  // ações de OS
  criarOS: (input: NovaOSInput) => Promise<void>
  iniciarAgendada: (os: OS) => Promise<void>
  liberar: (os: OS) => Promise<void>
  coletar: (os: OS) => Promise<void>
  concluir: (os: OS) => Promise<void>
  reabrir: (os: OS) => Promise<void>
  moverPara: (os: OS, setorId: string) => Promise<void>
  salvarObservacao: (os: OS, texto: string) => Promise<void>
  editarOS: (os: OS, patch: Partial<OS>) => Promise<void>
  excluirOS: (os: OS) => Promise<void>
  // ações de setor
  addSetor: (nome: string, cor: string) => Promise<void>
  editarSetor: (s: Setor, patch: Partial<Setor>) => Promise<void>
  moverSetor: (s: Setor, dir: -1 | 1) => Promise<void>
  removerSetor: (s: Setor) => Promise<void>
}

const Ctx = createContext<StoreCtx | null>(null)

const vazio: Snapshot = { setores: [], ordens: [], movimentacoes: [] }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(vazio)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const recarregarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recarregar = useCallback(async () => {
    try {
      const dados = await backend.fetchAll()
      setSnap(dados)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  const recarregarDebounced = useCallback(() => {
    if (recarregarTimer.current) clearTimeout(recarregarTimer.current)
    recarregarTimer.current = setTimeout(() => void recarregar(), 120)
  }, [recarregar])

  useEffect(() => {
    void recarregar()
    const off = backend.subscribe(recarregarDebounced)
    return () => off()
  }, [recarregar, recarregarDebounced])

  const setores = useMemo(
    () => [...snap.setores].sort((a, b) => a.ordem - b.ordem),
    [snap.setores],
  )
  const setoresAtivos = useMemo(() => setores.filter((s) => s.ativo), [setores])

  const nomeSetor = useCallback(
    (id: string | null) => setores.find((s) => s.id === id)?.nome ?? '—',
    [setores],
  )
  const corSetor = useCallback(
    (id: string | null) => setores.find((s) => s.id === id)?.cor ?? '#8892a4',
    [setores],
  )
  const proximoSetor = useCallback(
    (id: string | null) => {
      const idx = setoresAtivos.findIndex((s) => s.id === id)
      if (idx < 0) return setoresAtivos[0] ?? null
      return setoresAtivos[idx + 1] ?? null
    },
    [setoresAtivos],
  )

  // Aplica mudança otimista localmente para a UI responder na hora.
  const aplicar = useCallback((mut: (s: Snapshot) => Snapshot) => {
    setSnap((s) => mut(structuredClone(s)))
  }, [])

  const log = useCallback(
    async (
      os: OS,
      acao: AcaoMov,
      de: string | null,
      para: string | null,
      detalhe: string | null,
    ) => {
      const m: Movimentacao = {
        id: novoId(),
        os_id: os.id,
        numero_os: os.numero_os,
        de_setor_id: de,
        para_setor_id: para,
        acao,
        detalhe,
        criado_em: agora(),
      }
      aplicar((s) => ({ ...s, movimentacoes: [m, ...s.movimentacoes] }))
      await backend.insertMov(m)
    },
    [aplicar],
  )

  const salvarOS = useCallback(
    async (os: OS) => {
      aplicar((s) => ({
        ...s,
        ordens: s.ordens.some((o) => o.id === os.id)
          ? s.ordens.map((o) => (o.id === os.id ? os : o))
          : [...s.ordens, os],
      }))
      await backend.upsertOS(os)
    },
    [aplicar],
  )

  /* ------------------------------- Ações de OS ------------------------------ */

  const criarOS = useCallback(
    async (input: NovaOSInput) => {
      const primeiro = setoresAtivos[0]
      const agendarFuturo =
        !!input.data_entrada_prevista && input.data_entrada_prevista > hojeISO()
      const t = agora()
      const os: OS = {
        id: novoId(),
        numero_os: input.numero_os.trim(),
        cliente: input.cliente.trim() || null,
        descricao: input.descricao.trim() || null,
        prioridade: input.prioridade,
        estado: agendarFuturo || !primeiro ? 'agendada' : 'em_processo',
        setor_atual_id: agendarFuturo || !primeiro ? null : primeiro.id,
        observacoes: input.observacoes.trim() || null,
        prazo: input.prazo || null,
        data_entrada_prevista: input.data_entrada_prevista || null,
        desde: t,
        criado_em: t,
        concluida_em: null,
      }
      await salvarOS(os)
      await log(
        os,
        'cadastro',
        null,
        os.setor_atual_id,
        agendarFuturo
          ? `Agendada para ${input.data_entrada_prevista}`
          : primeiro
            ? `Entrou em ${primeiro.nome}`
            : 'Cadastrada (sem setor ativo)',
      )
    },
    [salvarOS, log, setoresAtivos],
  )

  const iniciarAgendada = useCallback(
    async (os: OS) => {
      const primeiro = setoresAtivos[0]
      if (!primeiro) return
      const atualizada: OS = {
        ...os,
        estado: 'em_processo',
        setor_atual_id: primeiro.id,
        desde: agora(),
      }
      await salvarOS(atualizada)
      await log(atualizada, 'iniciou', null, primeiro.id, `Entrou em ${primeiro.nome}`)
    },
    [salvarOS, log, setoresAtivos],
  )

  const liberar = useCallback(
    async (os: OS) => {
      const atual = os.setor_atual_id
      const prox = proximoSetor(atual)
      if (!prox) {
        // já está no último setor → concluir
        const concl: OS = {
          ...os,
          estado: 'concluida',
          concluida_em: agora(),
          desde: agora(),
        }
        await salvarOS(concl)
        await log(concl, 'concluiu', atual, atual, 'Concluída (último setor)')
        return
      }
      const atualizada: OS = {
        ...os,
        estado: 'aguardando_coleta',
        setor_atual_id: prox.id,
        desde: agora(),
      }
      await salvarOS(atualizada)
      await log(
        atualizada,
        'liberou',
        atual,
        prox.id,
        `Liberada para ${prox.nome} — aguardando coleta`,
      )
    },
    [salvarOS, log, proximoSetor],
  )

  const coletar = useCallback(
    async (os: OS) => {
      const atualizada: OS = { ...os, estado: 'em_processo', desde: agora() }
      await salvarOS(atualizada)
      await log(atualizada, 'coletou', os.setor_atual_id, os.setor_atual_id, 'Material coletado')
    },
    [salvarOS, log],
  )

  const concluir = useCallback(
    async (os: OS) => {
      const atualizada: OS = {
        ...os,
        estado: 'concluida',
        concluida_em: agora(),
        desde: agora(),
      }
      await salvarOS(atualizada)
      await log(atualizada, 'concluiu', os.setor_atual_id, os.setor_atual_id, 'Concluída')
    },
    [salvarOS, log],
  )

  const reabrir = useCallback(
    async (os: OS) => {
      const setor = os.setor_atual_id ?? setoresAtivos[0]?.id ?? null
      const atualizada: OS = {
        ...os,
        estado: 'em_processo',
        setor_atual_id: setor,
        concluida_em: null,
        desde: agora(),
      }
      await salvarOS(atualizada)
      await log(atualizada, 'reabriu', null, setor, 'OS reaberta')
    },
    [salvarOS, log, setoresAtivos],
  )

  const moverPara = useCallback(
    async (os: OS, setorId: string) => {
      if (setorId === os.setor_atual_id) return
      const atualizada: OS = {
        ...os,
        setor_atual_id: setorId,
        estado: 'aguardando_coleta',
        desde: agora(),
      }
      await salvarOS(atualizada)
      await log(
        atualizada,
        'moveu',
        os.setor_atual_id,
        setorId,
        'Movida manualmente — aguardando coleta',
      )
    },
    [salvarOS, log],
  )

  const salvarObservacao = useCallback(
    async (os: OS, texto: string) => {
      const t = texto.trim()
      const atualizada: OS = { ...os, observacoes: t || null }
      await salvarOS(atualizada)
      await log(atualizada, 'observacao', os.setor_atual_id, os.setor_atual_id, t || '(observação removida)')
    },
    [salvarOS, log],
  )

  const editarOS = useCallback(
    async (os: OS, patch: Partial<OS>) => {
      const atualizada = { ...os, ...patch }
      await salvarOS(atualizada)
      await log(atualizada, 'editou', os.setor_atual_id, os.setor_atual_id, 'Dados da OS editados')
    },
    [salvarOS, log],
  )

  const excluirOS = useCallback(
    async (os: OS) => {
      aplicar((s) => ({ ...s, ordens: s.ordens.filter((o) => o.id !== os.id) }))
      await backend.deleteOS(os.id)
    },
    [aplicar],
  )

  /* ----------------------------- Ações de setor ----------------------------- */

  const addSetor = useCallback(
    async (nome: string, cor: string) => {
      const ordem = (setores[setores.length - 1]?.ordem ?? -1) + 1
      const s: Setor = {
        id: novoId(),
        nome: nome.trim() || 'Novo setor',
        ordem,
        cor,
        ativo: true,
        criado_em: agora(),
      }
      aplicar((sn) => ({ ...sn, setores: [...sn.setores, s] }))
      await backend.upsertSetor(s)
    },
    [setores, aplicar],
  )

  const editarSetor = useCallback(
    async (s: Setor, patch: Partial<Setor>) => {
      const atualizado = { ...s, ...patch }
      aplicar((sn) => ({
        ...sn,
        setores: sn.setores.map((x) => (x.id === s.id ? atualizado : x)),
      }))
      await backend.upsertSetor(atualizado)
    },
    [aplicar],
  )

  const moverSetor = useCallback(
    async (s: Setor, dir: -1 | 1) => {
      const lista = [...setores]
      const i = lista.findIndex((x) => x.id === s.id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= lista.length) return
      const a = lista[i]
      const b = lista[j]
      const novoA = { ...a, ordem: b.ordem }
      const novoB = { ...b, ordem: a.ordem }
      aplicar((sn) => ({
        ...sn,
        setores: sn.setores.map((x) =>
          x.id === a.id ? novoA : x.id === b.id ? novoB : x,
        ),
      }))
      await backend.upsertSetor(novoA)
      await backend.upsertSetor(novoB)
    },
    [setores, aplicar],
  )

  const removerSetor = useCallback(
    async (s: Setor) => {
      // Segurança: se houver OS no setor, apenas desativa em vez de excluir.
      const temOS = snap.ordens.some((o) => o.setor_atual_id === s.id)
      if (temOS) {
        await editarSetor(s, { ativo: false })
        return
      }
      aplicar((sn) => ({ ...sn, setores: sn.setores.filter((x) => x.id !== s.id) }))
      await backend.deleteSetor(s.id)
    },
    [snap.ordens, aplicar, editarSetor],
  )

  const value: StoreCtx = {
    loading,
    realtime: backend.realtime,
    erro,
    setores,
    setoresAtivos,
    ordens: snap.ordens,
    movimentacoes: snap.movimentacoes,
    nomeSetor,
    corSetor,
    proximoSetor,
    criarOS,
    iniciarAgendada,
    liberar,
    coletar,
    concluir,
    reabrir,
    moverPara,
    salvarObservacao,
    editarOS,
    excluirOS,
    addSetor,
    editarSetor,
    moverSetor,
    removerSetor,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore deve estar dentro de <StoreProvider>')
  return ctx
}
