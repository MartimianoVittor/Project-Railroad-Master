-- Railroad RPG | 007 - Sessoes e NPCs vinculados a campanhas
-- Execute apos 001..006 no mesmo projeto Supabase.
-- Aditiva: nao migra nem apaga dados locais existentes.
begin;

create table if not exists public.sessoes (
    id uuid primary key default gen_random_uuid(),
    campanha_id uuid not null references public.campanhas(id) on delete cascade,
    nome text not null default '' check (char_length(nome) <= 80),
    descricao text not null default '' check (char_length(descricao) <= 25),
    notas text not null default '' check (char_length(notas) <= 50000),
    quadro jsonb not null default '{"desenhoCanvas":"","itensQuadro":[]}'::jsonb
        check (jsonb_typeof(quadro) = 'object'),
    posicao integer not null default 0,
    ativa boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.npcs (
    id uuid primary key default gen_random_uuid(),
    campanha_id uuid not null references public.campanhas(id) on delete cascade,
    npc_origem_id uuid references public.npcs(id) on delete set null,
    nome text not null default '' check (char_length(nome) <= 100),
    dados jsonb not null default '{}'::jsonb check (jsonb_typeof(dados) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists sessoes_campanha_posicao_idx on public.sessoes(campanha_id,posicao,created_at);
create unique index if not exists sessoes_uma_ativa_por_campanha_idx on public.sessoes(campanha_id) where ativa;
create index if not exists npcs_campanha_nome_idx on public.npcs(campanha_id,nome);
create index if not exists npcs_origem_idx on public.npcs(npc_origem_id);

-- O trigger ja foi definido em 001.sql.
drop trigger if exists sessoes_atualizadas_em on public.sessoes;
create trigger sessoes_atualizadas_em before update on public.sessoes
    for each row execute function public.atualizar_data_ficha();
drop trigger if exists npcs_atualizados_em on public.npcs;
create trigger npcs_atualizados_em before update on public.npcs
    for each row execute function public.atualizar_data_ficha();

alter table public.sessoes enable row level security;
alter table public.npcs enable row level security;
revoke all on public.sessoes from anon, authenticated;
revoke all on public.npcs from anon, authenticated;
grant select, insert, update, delete on public.sessoes to authenticated;
grant select, insert, update, delete on public.npcs to authenticated;

-- Mesmo proprietario da campanha, em todas as operacoes.
drop policy if exists sessoes_mestre_select on public.sessoes;
create policy sessoes_mestre_select on public.sessoes for select to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists sessoes_mestre_insert on public.sessoes;
create policy sessoes_mestre_insert on public.sessoes for insert to authenticated
    with check (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists sessoes_mestre_update on public.sessoes;
create policy sessoes_mestre_update on public.sessoes for update to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())))
    with check (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists sessoes_mestre_delete on public.sessoes;
create policy sessoes_mestre_delete on public.sessoes for delete to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));

drop policy if exists npcs_mestre_select on public.npcs;
create policy npcs_mestre_select on public.npcs for select to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists npcs_mestre_insert on public.npcs;
create policy npcs_mestre_insert on public.npcs for insert to authenticated
    with check (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists npcs_mestre_update on public.npcs;
create policy npcs_mestre_update on public.npcs for update to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())))
    with check (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));
drop policy if exists npcs_mestre_delete on public.npcs;
create policy npcs_mestre_delete on public.npcs for delete to authenticated
    using (exists (select 1 from public.campanhas c where c.id=campanha_id and c.mestre_id=(select auth.uid())));

-- Copia profunda do JSON: novo registro, novo UUID, dados independentes.
-- A origem so pode ser lida pelo proprio Mestre; destino deve pertencer a ele.
create or replace function public.copiar_npc_para_campanha(p_npc_id uuid, p_campanha_destino_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_origem public.npcs%rowtype; v_novo_id uuid;
begin
    if (select auth.uid()) is null then raise exception 'Autenticacao obrigatoria'; end if;
    select * into v_origem from public.npcs where id = p_npc_id;
    if not found then raise exception 'NPC nao encontrado ou sem permissao'; end if;
    if not exists (select 1 from public.campanhas c where c.id=p_campanha_destino_id and c.mestre_id=(select auth.uid())) then
        raise exception 'Campanha de destino nao encontrada ou sem permissao';
    end if;
    v_novo_id := gen_random_uuid();
    insert into public.npcs(id,campanha_id,npc_origem_id,nome,dados)
    values (v_novo_id,p_campanha_destino_id,v_origem.id,v_origem.nome,
            jsonb_set(v_origem.dados,'{id}',to_jsonb(v_novo_id::text),true));
    return v_novo_id;
end;
$$;
revoke all on function public.copiar_npc_para_campanha(uuid,uuid) from public, anon;
grant execute on function public.copiar_npc_para_campanha(uuid,uuid) to authenticated;

commit;
