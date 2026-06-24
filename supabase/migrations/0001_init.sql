-- Estrutura do Controle de Produção (Click Impresso)
-- Aplique no seu projeto Supabase (SQL Editor) ou via CLI.

-- ───────────────────────────── Tabelas ─────────────────────────────

create table if not exists public.setores (
  id uuid primary key,
  nome text not null,
  ordem int not null default 0,
  cor text not null default '#4f8ef7',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.ordens (
  id uuid primary key,
  numero_os text not null,
  cliente text,
  descricao text,
  prioridade text not null default 'normal',
  estado text not null default 'em_processo',
  setor_atual_id uuid references public.setores(id) on delete set null,
  observacoes text,
  prazo date,
  data_entrada_prevista date,
  desde timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  concluida_em timestamptz
);

create table if not exists public.movimentacoes (
  id uuid primary key,
  os_id uuid not null,
  numero_os text not null,
  de_setor_id uuid,
  para_setor_id uuid,
  acao text not null,
  detalhe text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_ordens_setor on public.ordens (setor_atual_id);
create index if not exists idx_ordens_estado on public.ordens (estado);
create index if not exists idx_mov_os on public.movimentacoes (os_id);

-- ──────────────────────── Segurança (RLS) ──────────────────────────
-- Ferramenta interna sem login: acesso liberado para a chave anônima.
-- (Troque por políticas com autenticação se quiser restringir.)

alter table public.setores enable row level security;
alter table public.ordens enable row level security;
alter table public.movimentacoes enable row level security;

drop policy if exists acesso_total_setores on public.setores;
drop policy if exists acesso_total_ordens on public.ordens;
drop policy if exists acesso_total_movimentacoes on public.movimentacoes;

create policy acesso_total_setores on public.setores for all using (true) with check (true);
create policy acesso_total_ordens on public.ordens for all using (true) with check (true);
create policy acesso_total_movimentacoes on public.movimentacoes for all using (true) with check (true);

-- ──────────────────────── Tempo real ───────────────────────────────

alter publication supabase_realtime add table public.setores;
alter publication supabase_realtime add table public.ordens;
alter publication supabase_realtime add table public.movimentacoes;

-- ──────────────────── Setores padrão (1ª vez) ──────────────────────

insert into public.setores (id, nome, ordem, cor)
select gen_random_uuid(), x.nome, x.ordem, x.cor
from (values
  ('Pré-impressão', 0, '#4f8ef7'),
  ('Impressão', 1, '#f5a623'),
  ('Acabamento', 2, '#9b59b6'),
  ('Expedição', 3, '#2ecc71')
) as x(nome, ordem, cor)
where not exists (select 1 from public.setores);
