-- Executar após 005_escudo_campanhas.sql no Supabase.
-- Apenas o mestre proprietário pode excluir sua campanha.
-- Convites e envios associados usam ON DELETE CASCADE; fichas pessoais permanecem.
create or replace function public.excluir_campanha_mestre(p_campanha_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.uid() is null then
        raise exception 'Autenticação necessária';
    end if;
    delete from public.campanhas
    where id = p_campanha_id and mestre_id = auth.uid();
    if not found then
        raise exception 'Campanha não encontrada ou sem permissão para excluir';
    end if;
end;
$$;
revoke all on function public.excluir_campanha_mestre(uuid) from public, anon;
grant execute on function public.excluir_campanha_mestre(uuid) to authenticated;
