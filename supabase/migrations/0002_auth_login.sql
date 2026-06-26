-- Login por e-mail/senha + RLS restrita a usuários autenticados.
-- Aplique no SQL Editor do Supabase (ou via CLI) DEPOIS do 0001_init.sql.

-- ───────────────────── Extensão para hashear senhas ─────────────────────
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────── Criar usuários de login ────────────────────────
-- Cria um usuário já confirmado (sem precisar de e-mail de confirmação).
-- Uso:  select public.criar_usuario('fulano@empresa.com', 'senha123');
create or replace function public.criar_usuario(p_email text, p_senha text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  novo_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', novo_id, 'authenticated', 'authenticated',
    lower(p_email), extensions.crypt(p_senha, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    '', '', '', ''
  );

  -- A coluna auth.identities.email é GERADA a partir de identity_data->>'email'
  -- nas versões recentes do GoTrue; não pode receber valor no INSERT.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), novo_id, novo_id::text, 'email',
    jsonb_build_object('sub', novo_id::text, 'email', lower(p_email),
                       'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );

  return novo_id;
end;
$$;

-- Apenas o owner/postgres (e service_role) deve poder criar usuários.
revoke execute on function public.criar_usuario(text, text) from public, anon, authenticated;

-- ───────────────────────── RLS só para logados ──────────────────────────
-- Substitui o acesso liberado da chave anônima (definido no 0001).
drop policy if exists acesso_total_setores on public.setores;
drop policy if exists acesso_total_ordens on public.ordens;
drop policy if exists acesso_total_movimentacoes on public.movimentacoes;

create policy logado_setores on public.setores
  for all to authenticated using (true) with check (true);
create policy logado_ordens on public.ordens
  for all to authenticated using (true) with check (true);
create policy logado_movimentacoes on public.movimentacoes
  for all to authenticated using (true) with check (true);
