-- RAILROAD MESTRE v0.8.0 · FICHAS EM MODO LEITURA
-- Executar DEPOIS de 004_campanhas_convites.sql e 005_escudo_campanhas.sql.
-- Não remove campanhas, convites, personagens ou dados salvos.
-- Impede que o Mestre leia o JSON completo (incluindo o quadro de ideias)
-- e oferece uma RPC que retorna somente os três blocos autorizados.

begin;

-- A política anterior permitia SELECT do JSON completo para o Mestre.
-- Os próprios jogadores continuam lendo suas fichas via fichas_ler_proprias.
drop policy if exists fichas_ler_em_campanhas on public.fichas;

create or replace function railroad_private.obter_ficha_para_mestre(
    p_campanha_id uuid,
    p_ficha_id uuid
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
    v_registro jsonb;
begin
    if (select auth.uid()) is null then
        raise exception 'Entre com Google para consultar as fichas.';
    end if;

    select jsonb_build_object(
        'id', ficha.id,
        'titulo', ficha.titulo,
        'usuario_id', ficha.usuario_id,
        'updated_at', ficha.updated_at,
        'dados', jsonb_build_object(
            'nome', ficha.dados -> 'nome',
            'apelido', ficha.dados -> 'apelido',
            'bio', ficha.dados -> 'bio',
            'fotoPerfil', ficha.dados -> 'fotoPerfil',
            'personagem', jsonb_build_object(
                'nome-personagem', ficha.dados #> '{personagem,nome-personagem}',
                'apelido-personagem', ficha.dados #> '{personagem,apelido-personagem}',
                'profissao-personagem', ficha.dados #> '{personagem,profissao-personagem}',
                'lingua-personagem', ficha.dados #> '{personagem,lingua-personagem}',
                'foto', ficha.dados #> '{personagem,foto}',
                'fama', ficha.dados #> '{personagem,fama}',
                'palavra', ficha.dados #> '{personagem,palavra}',
                'dinheiro', ficha.dados #> '{personagem,dinheiro}',
                'bio-personagem', ficha.dados #> '{personagem,bio-personagem}',
                'marcadores', ficha.dados #> '{personagem,marcadores}'
            ),
            'inventario', jsonb_build_object(
                'itens', ficha.dados #> '{inventario,itens}',
                'rolagens', ficha.dados #> '{inventario,rolagens}'
            )
        )
    ) into v_registro
    from public.fichas as ficha
    join public.campanha_fichas as envio on envio.ficha_id = ficha.id
    join public.campanha_convites as convite on convite.id = envio.convite_id
    join public.campanhas as campanha on campanha.id = envio.campanha_id
    where ficha.id = p_ficha_id
      and campanha.id = p_campanha_id
      and campanha.mestre_id = (select auth.uid())
      and convite.campanha_id = campanha.id
      and convite.jogador_id = ficha.usuario_id
      and convite.status = 'aceito'
      and envio.status in ('pendente', 'aprovada');

    if v_registro is null then
        raise exception 'Ficha não compartilhada com esta campanha ou acesso não autorizado.';
    end if;

    return v_registro;
end;
$$;

-- Wrapper público compatível com a Data API do Supabase.
create or replace function public.obter_ficha_para_mestre(
    p_campanha_id uuid,
    p_ficha_id uuid
)
returns jsonb
language sql security invoker set search_path = ''
as $$
    select railroad_private.obter_ficha_para_mestre(p_campanha_id, p_ficha_id);
$$;

revoke execute on function railroad_private.obter_ficha_para_mestre(uuid, uuid) from public, anon;
revoke execute on function public.obter_ficha_para_mestre(uuid, uuid) from public, anon;
grant execute on function railroad_private.obter_ficha_para_mestre(uuid, uuid) to authenticated;
grant execute on function public.obter_ficha_para_mestre(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
