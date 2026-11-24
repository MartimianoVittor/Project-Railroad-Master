-- Execute no SQL Editor do projeto Supabase antes de publicar o frontend.
begin;
create table if not exists public.preferencias_visuais_mestre (
    usuario_id uuid primary key references auth.users(id) on delete cascade,
    preferencias jsonb not null check (jsonb_typeof(preferencias) = 'object'),
    atualizado_em timestamptz not null default now()
);
alter table public.preferencias_visuais_mestre enable row level security;
revoke all on public.preferencias_visuais_mestre from anon, authenticated;
grant select, insert, update on public.preferencias_visuais_mestre to authenticated;
drop policy if exists preferencias_mestre_proprias on public.preferencias_visuais_mestre;
create policy preferencias_mestre_proprias on public.preferencias_visuais_mestre
    for all to authenticated using (auth.uid() = usuario_id)
    with check (auth.uid() = usuario_id);
commit;
