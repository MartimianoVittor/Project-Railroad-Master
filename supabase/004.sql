-- RAILROAD MESTRE v0.4.0 · ABA CAMPANHAS
-- Aplicar APÓS 004_campanhas_convites.sql, no mesmo projeto Supabase.
-- Migração aditiva: preserva campanhas, convites e fichas existentes.

begin;

-- Descrição opcional, persistida junto com a campanha.
alter table public.campanhas
    add column if not exists descricao text not null default '';

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.campanhas'::regclass
          and conname = 'campanhas_descricao_tamanho'
    ) then
        alter table public.campanhas
            add constraint campanhas_descricao_tamanho
            check (char_length(descricao) <= 1000);
    end if;
end;
$$;

-- Novas RPCs mantêm as antigas para não quebrar clientes já publicados.
create or replace function railroad_private.criar_campanha_descrita_mestre(
    p_nome text, p_descricao text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
    v_id uuid;
    v_descricao text := trim(coalesce(p_descricao, ''));
begin
    if (select auth.uid()) is null
       or char_length(trim(coalesce(p_nome, ''))) not between 1 and 120 then
        raise exception 'Informe um nome de campanha de 1 a 120 caracteres.';
    end if;
    if char_length(v_descricao) > 1000 then
        raise exception 'A descrição deve ter no máximo 1000 caracteres.';
    end if;

    insert into public.campanhas (mestre_id, nome, descricao)
    values ((select auth.uid()), trim(p_nome), v_descricao)
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function railroad_private.listar_campanhas_detalhadas_mestre()
returns table (campanha_id uuid, nome text, descricao text, criada_em timestamptz)
language sql stable security definer set search_path = ''
as $$
    select campanha.id, campanha.nome, campanha.descricao, campanha.created_at
    from public.campanhas as campanha
    where campanha.mestre_id = (select auth.uid())
    order by campanha.created_at desc;
$$;

-- Um registro por ficha enviada; convite sem ficha produz uma linha sem envio_id.
-- O nome público vem dos metadados do Google, nunca do e-mail privado.
create or replace function railroad_private.listar_participantes_campanha_mestre(p_campanha_id uuid)
returns table (
    convite_id uuid, jogador_id uuid, jogador_nome text, convite_status text,
    envio_id uuid, personagem_nome text, ficha_status text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
    if not exists (
        select 1 from public.campanhas as campanha
        where campanha.id = p_campanha_id
          and campanha.mestre_id = (select auth.uid())
    ) then
        raise exception 'Campanha não encontrada ou não pertence à sua conta.';
    end if;

    return query
        select convite.id, convite.jogador_id,
               coalesce(
                   nullif(trim(usuario.raw_user_meta_data ->> 'full_name'), ''),
                   nullif(trim(usuario.raw_user_meta_data ->> 'name'), ''),
                   'Jogador ' || left(convite.jogador_id::text, 8)
               ),
               convite.status,
               envio.id,
               coalesce(nullif(trim(ficha.dados -> 'personagem' ->> 'nome-personagem'), ''), ficha.titulo),
               envio.status
        from public.campanha_convites as convite
        join auth.users as usuario on usuario.id = convite.jogador_id
        left join public.campanha_fichas as envio
            on envio.convite_id = convite.id
           and envio.campanha_id = convite.campanha_id
        left join public.fichas as ficha
            on ficha.id = envio.ficha_id
           and ficha.usuario_id = convite.jogador_id
        where convite.campanha_id = p_campanha_id
        order by convite.created_at desc, envio.created_at desc nulls last;
end;
$$;

-- Remove a participação e todos os envios por CASCADE, mas NÃO apaga as
-- fichas pessoais do jogador. A exclusão exige a propriedade da campanha.
create or replace function railroad_private.excluir_jogador_mesa_mestre(
    p_campanha_id uuid, p_jogador_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
    delete from public.campanha_convites as convite
    using public.campanhas as campanha
    where convite.campanha_id = campanha.id
      and campanha.id = p_campanha_id
      and campanha.mestre_id = (select auth.uid())
      and convite.jogador_id = p_jogador_id;

    if not found then
        raise exception 'Jogador não encontrado nesta campanha ou acesso não autorizado.';
    end if;
end;
$$;

-- Wrappers expostos via RPC, sem acesso direto às tabelas protegidas.
create or replace function public.criar_campanha_descrita_mestre(p_nome text, p_descricao text)
returns uuid language sql security invoker set search_path = ''
as $$ select railroad_private.criar_campanha_descrita_mestre(p_nome, p_descricao); $$;

create or replace function public.listar_campanhas_detalhadas_mestre()
returns table (campanha_id uuid, nome text, descricao text, criada_em timestamptz)
language sql security invoker set search_path = ''
as $$ select * from railroad_private.listar_campanhas_detalhadas_mestre(); $$;

create or replace function public.listar_participantes_campanha_mestre(p_campanha_id uuid)
returns table (
    convite_id uuid, jogador_id uuid, jogador_nome text, convite_status text,
    envio_id uuid, personagem_nome text, ficha_status text
)
language sql security invoker set search_path = ''
as $$ select * from railroad_private.listar_participantes_campanha_mestre(p_campanha_id); $$;

create or replace function public.excluir_jogador_mesa_mestre(p_campanha_id uuid, p_jogador_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select railroad_private.excluir_jogador_mesa_mestre(p_campanha_id, p_jogador_id); $$;

revoke execute on function railroad_private.criar_campanha_descrita_mestre(text, text) from public, anon;
revoke execute on function railroad_private.listar_campanhas_detalhadas_mestre() from public, anon;
revoke execute on function railroad_private.listar_participantes_campanha_mestre(uuid) from public, anon;
revoke execute on function railroad_private.excluir_jogador_mesa_mestre(uuid, uuid) from public, anon;
revoke execute on function public.criar_campanha_descrita_mestre(text, text) from public, anon;
revoke execute on function public.listar_campanhas_detalhadas_mestre() from public, anon;
revoke execute on function public.listar_participantes_campanha_mestre(uuid) from public, anon;
revoke execute on function public.excluir_jogador_mesa_mestre(uuid, uuid) from public, anon;

grant execute on function railroad_private.criar_campanha_descrita_mestre(text, text) to authenticated;
grant execute on function railroad_private.listar_campanhas_detalhadas_mestre() to authenticated;
grant execute on function railroad_private.listar_participantes_campanha_mestre(uuid) to authenticated;
grant execute on function railroad_private.excluir_jogador_mesa_mestre(uuid, uuid) to authenticated;
grant execute on function public.criar_campanha_descrita_mestre(text, text) to authenticated;
grant execute on function public.listar_campanhas_detalhadas_mestre() to authenticated;
grant execute on function public.listar_participantes_campanha_mestre(uuid) to authenticated;
grant execute on function public.excluir_jogador_mesa_mestre(uuid, uuid) to authenticated;

commit;

-- Solicita atualização do catálogo de funções da API REST do Supabase.
notify pgrst, 'reload schema';
