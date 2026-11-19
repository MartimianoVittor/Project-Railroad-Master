-- Railroad RPG | 008 - Corrigir autorizacao de sessoes e NPCs
-- Requer as migracoes 001..007. Nao altera ou exclui registros.
-- Execute no SQL Editor como administrador do projeto.
begin;

-- campanhas nao concede SELECT a authenticated: a verificacao deve ocorrer
-- em uma funcao SECURITY DEFINER que consulta apenas o proprietario.
create or replace function railroad_private.mestre_possui_campanha(p_campanha_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.campanhas c
    where c.id = p_campanha_id and c.mestre_id = (select auth.uid())
  );
$$;
revoke all on function railroad_private.mestre_possui_campanha(uuid) from public, anon;
grant execute on function railroad_private.mestre_possui_campanha(uuid) to authenticated;

-- Recria somente as politicas introduzidas pela migracao 007.
drop policy if exists sessoes_mestre_select on public.sessoes;
create policy sessoes_mestre_select on public.sessoes for select to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists sessoes_mestre_insert on public.sessoes;
create policy sessoes_mestre_insert on public.sessoes for insert to authenticated
  with check (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists sessoes_mestre_update on public.sessoes;
create policy sessoes_mestre_update on public.sessoes for update to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id))
  with check (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists sessoes_mestre_delete on public.sessoes;
create policy sessoes_mestre_delete on public.sessoes for delete to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id));

drop policy if exists npcs_mestre_select on public.npcs;
create policy npcs_mestre_select on public.npcs for select to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists npcs_mestre_insert on public.npcs;
create policy npcs_mestre_insert on public.npcs for insert to authenticated
  with check (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists npcs_mestre_update on public.npcs;
create policy npcs_mestre_update on public.npcs for update to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id))
  with check (railroad_private.mestre_possui_campanha(campanha_id));
drop policy if exists npcs_mestre_delete on public.npcs;
create policy npcs_mestre_delete on public.npcs for delete to authenticated
  using (railroad_private.mestre_possui_campanha(campanha_id));

-- A funcao de copia da migracao 007 tambem consultava campanhas diretamente.
create or replace function public.copiar_npc_para_campanha(p_npc_id uuid, p_campanha_destino_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_origem public.npcs%rowtype; v_novo_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Autenticacao obrigatoria'; end if;
  select * into v_origem from public.npcs where id = p_npc_id;
  if not found then raise exception 'NPC nao encontrado ou sem permissao'; end if;
  if not railroad_private.mestre_possui_campanha(p_campanha_destino_id) then
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
