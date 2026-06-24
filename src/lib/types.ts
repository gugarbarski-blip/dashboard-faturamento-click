// Modelo de dados do controle de produção.

// Estado de uma OS dentro da esteira:
// - agendada: cadastrada para entrar nos próximos dias (ainda não está na produção)
// - em_processo: um setor está trabalhando nela agora
// - aguardando_coleta: foi liberada para o próximo setor e espera ser coletada
// - concluida: terminou todas as etapas
export type Estado = 'agendada' | 'em_processo' | 'aguardando_coleta' | 'concluida'

export type Prioridade = 'normal' | 'urgente'

export type AcaoMov =
  | 'cadastro'
  | 'iniciou'
  | 'liberou'
  | 'coletou'
  | 'concluiu'
  | 'observacao'
  | 'reabriu'
  | 'editou'
  | 'moveu'

export interface Setor {
  id: string
  nome: string
  ordem: number
  cor: string
  ativo: boolean
  criado_em: string
}

export interface OS {
  id: string
  numero_os: string
  cliente: string | null
  descricao: string | null
  prioridade: Prioridade
  estado: Estado
  setor_atual_id: string | null
  observacoes: string | null
  prazo: string | null // data de entrega (yyyy-mm-dd)
  data_entrada_prevista: string | null // para OS agendadas (yyyy-mm-dd)
  desde: string // ISO timestamp em que entrou no estado/setor atual
  criado_em: string
  concluida_em: string | null
}

export interface Movimentacao {
  id: string
  os_id: string
  numero_os: string
  de_setor_id: string | null
  para_setor_id: string | null
  acao: AcaoMov
  detalhe: string | null
  criado_em: string
}

export interface Snapshot {
  setores: Setor[]
  ordens: OS[]
  movimentacoes: Movimentacao[]
}

export interface NovaOSInput {
  numero_os: string
  cliente: string
  descricao: string
  prioridade: Prioridade
  prazo: string
  data_entrada_prevista: string
  observacoes: string
}
