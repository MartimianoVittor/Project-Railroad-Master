-- Railroad RPG | 015 - Escritas do Mestre exclusivamente por RPCs autorizadas.
-- Requer 001..014. Execute no SQL Editor com backup e antes de publicar o PATCH.
-- ATENCAO: clientes Mestre antigos deixam de conseguir gravar diretamente.
BEGIN;

-- As RPCs existentes validam auth.uid() e a propriedade da campanha.
-- SECURITY DEFINER permite revogar INSERT/UPDATE/DELETE sem quebrar essas RPCs.
ALTER FUNCTION public.salvar_estado_mestre(uuid,text,jsonb,bigint) SECURITY DEFINER;
ALTER FUNCTION public.salvar_diario_mestre(uuid,jsonb,uuid,uuid[],bigint) SECURITY DEFINER;
ALTER FUNCTION public.salvar_npc_mestre(uuid,uuid,text,jsonb,bigint) SECURITY DEFINER;
ALTER FUNCTION public.salvar_npcs_combate_mestre(uuid,jsonb) SECURITY DEFINER;

-- A exclusao de NPC deve comparar revisao, como o salvamento.
CREATE OR REPLACE FUNCTION public.excluir_npc_mestre(
    p_campanha_id uuid, p_npc_id uuid, p_revisao bigint
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL OR p_campanha_id IS NULL
       OR p_npc_id IS NULL OR p_revisao IS NULL OR p_revisao < 1 THEN
        RAISE EXCEPTION 'Parâmetros inválidos para excluir NPC.';
    END IF;
    IF NOT railroad_private.mestre_possui_campanha(p_campanha_id) THEN
        RAISE EXCEPTION 'Campanha não encontrada ou sem permissão.';
    END IF;
    DELETE FROM public.npcs AS n
    WHERE n.campanha_id = p_campanha_id AND n.id = p_npc_id
      AND n.revisao = p_revisao;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflito: o NPC foi alterado ou removido em outro dispositivo.';
    END IF;
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.excluir_npc_mestre(uuid,uuid,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.excluir_npc_mestre(uuid,uuid,bigint) TO authenticated;

-- A copia original dependia da RLS para verificar a propriedade da origem.
-- Ao usar SECURITY DEFINER, a verificacao precisa ser explicita.
CREATE OR REPLACE FUNCTION public.copiar_npc_para_campanha(
    p_npc_id uuid, p_campanha_destino_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_origem public.npcs%ROWTYPE; v_novo_id uuid;
BEGIN
    IF (SELECT auth.uid()) IS NULL OR p_npc_id IS NULL OR p_campanha_destino_id IS NULL THEN
        RAISE EXCEPTION 'Parâmetros inválidos para copiar NPC.';
    END IF;
    SELECT n.* INTO v_origem FROM public.npcs AS n
    WHERE n.id = p_npc_id
      AND railroad_private.mestre_possui_campanha(n.campanha_id);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'NPC de origem não encontrado ou sem permissão.';
    END IF;
    IF NOT railroad_private.mestre_possui_campanha(p_campanha_destino_id) THEN
        RAISE EXCEPTION 'Campanha de destino não encontrada ou sem permissão.';
    END IF;
    v_novo_id := gen_random_uuid();
    INSERT INTO public.npcs(id,campanha_id,npc_origem_id,nome,dados)
    VALUES (v_novo_id,p_campanha_destino_id,v_origem.id,v_origem.nome,
            jsonb_set(v_origem.dados,'{id}',to_jsonb(v_novo_id::text),true));
    RETURN v_novo_id;
END;
$$;
REVOKE ALL ON FUNCTION public.copiar_npc_para_campanha(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.copiar_npc_para_campanha(uuid,uuid) TO authenticated;

-- As politicas RLS de leitura continuam ativas. Removemos apenas escrita direta.
REVOKE INSERT, UPDATE, DELETE ON public.npcs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sessoes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.estados_mestre FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.diarios_mestre FROM authenticated;
COMMIT;
