import type { Snapshot, Setor, OS } from './types'
import { agora, novoId } from './format'

// Setores padrão de uma gráfica — você pode renomear/adicionar/remover na tela "Setores".
export const SETORES_PADRAO: Array<{ nome: string; cor: string }> = [
  { nome: 'Pré-impressão', cor: '#4f8ef7' },
  { nome: 'Impressão', cor: '#f5a623' },
  { nome: 'Acabamento', cor: '#9b59b6' },
  { nome: 'Expedição', cor: '#2ecc71' },
]

export function setoresPadrao(): Setor[] {
  const t = agora()
  return SETORES_PADRAO.map((s, i) => ({
    id: novoId(),
    nome: s.nome,
    ordem: i,
    cor: s.cor,
    ativo: true,
    criado_em: t,
  }))
}

// Snapshot inicial usado no modo demonstração (dados ficam só no navegador).
export function seedSnapshot(): Snapshot {
  const setores = setoresPadrao()
  const [pre, imp, aca] = setores
  const minutosAtras = (m: number) => new Date(Date.now() - m * 60000).toISOString()

  const ordens: OS[] = [
    {
      id: novoId(),
      numero_os: '1042',
      cliente: 'Padaria Pão Quente',
      descricao: '500 panfletos A5 4x4',
      prioridade: 'urgente',
      estado: 'aguardando_coleta',
      setor_atual_id: imp.id,
      observacoes: 'Cliente vai retirar hoje às 17h.',
      prazo: null,
      data_entrada_prevista: null,
      desde: minutosAtras(95),
      criado_em: minutosAtras(180),
      concluida_em: null,
    },
    {
      id: novoId(),
      numero_os: '1043',
      cliente: 'Auto Center Silva',
      descricao: 'Banner 1x2m',
      prioridade: 'normal',
      estado: 'em_processo',
      setor_atual_id: aca.id,
      observacoes: null,
      prazo: null,
      data_entrada_prevista: null,
      desde: minutosAtras(20),
      criado_em: minutosAtras(240),
      concluida_em: null,
    },
    {
      id: novoId(),
      numero_os: '1044',
      cliente: 'Escola Aprender',
      descricao: '2.000 apostilas grampeadas',
      prioridade: 'normal',
      estado: 'em_processo',
      setor_atual_id: pre.id,
      observacoes: 'Conferir miolo antes de imprimir.',
      prazo: null,
      data_entrada_prevista: null,
      desde: minutosAtras(8),
      criado_em: minutosAtras(15),
      concluida_em: null,
    },
  ]

  return { setores, ordens, movimentacoes: [] }
}
