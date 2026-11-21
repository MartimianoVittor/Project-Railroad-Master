-- Railroad Mestre | 009 - Estados operacionais de Combate e Viagens.
-- Aplicar APOS 007 e 008 no MESMO Supabase do Railroad Jogador.
-- Migração ADITIVA: não altera fichas, sessões, NPCs ou campanhas existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.estados_mestre (
    campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('combate', 'viagens')),
    dados jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(dados) = 'object'),
    revisao bigint NOT NULL DEFAULT 1 CHECK (revisao > 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (campanha_id, tipo)
);

ALTER TABLE public.estados_mestre ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.estados_mestre FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.estados_mestre TO authenticated;

DROP POLICY IF EXISTS estados_mestre_select ON public.estados_mestre;
CREATE POLICY estados_mestre_select ON public.estados_mestre
    FOR SELECT TO authenticated
    USING (railroad_private.mestre_possui_campanha(campanha_id));
DROP POLICY IF EXISTS estados_mestre_insert ON public.estados_mestre;
CREATE POLICY estados_mestre_insert ON public.estados_mestre
    FOR INSERT TO authenticated
    WITH CHECK (railroad_private.mestre_possui_campanha(campanha_id));
DROP POLICY IF EXISTS estados_mestre_update ON public.estados_mestre;
CREATE POLICY estados_mestre_update ON public.estados_mestre
    FOR UPDATE TO authenticated
    USING (railroad_private.mestre_possui_campanha(campanha_id))
    WITH CHECK (railroad_private.mestre_possui_campanha(campanha_id));

-- Gravação atômica com checagem de versão: o Mestre não sobrescreve
-- silenciosamente alterações efetuadas em outra aba ou dispositivo.
CREATE OR REPLACE FUNCTION public.salvar_estado_mestre(
    p_campanha_id uuid, p_tipo text, p_dados jsonb, p_revisao bigint
) RETURNS TABLE(revisao bigint, updated_at timestamptz)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL OR p_campanha_id IS NULL
       OR p_tipo IS NULL OR p_tipo NOT IN ('combate','viagens')
       OR p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object'
       OR p_revisao IS NULL OR p_revisao < 0 THEN
        RAISE EXCEPTION 'Parâmetros inválidos para salvar estado do Mestre.';
    END IF;
    IF octet_length(p_dados::text) > 2000000 THEN
        RAISE EXCEPTION 'O estado excede o limite de 2 MB.';
    END IF;
    IF NOT railroad_private.mestre_possui_campanha(p_campanha_id) THEN
        RAISE EXCEPTION 'Campanha não encontrada ou sem permissão.';
    END IF;

    IF p_revisao = 0 THEN
        INSERT INTO public.estados_mestre AS em (campanha_id, tipo, dados, revisao)
        VALUES (p_campanha_id, p_tipo, p_dados, 1)
        ON CONFLICT (campanha_id,tipo) DO NOTHING;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Conflito: o estado foi criado em outra aba. Recarregue antes de sincronizar.';
        END IF;
    ELSE
        UPDATE public.estados_mestre AS em
        SET dados = p_dados, revisao = em.revisao + 1, updated_at = now()
        WHERE em.campanha_id = p_campanha_id AND em.tipo = p_tipo
          AND em.revisao = p_revisao;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Conflito: o estado foi alterado em outra aba ou dispositivo. Os dados locais foram preservados.';
        END IF;
    END IF;
    RETURN QUERY SELECT em.revisao, em.updated_at FROM public.estados_mestre AS em
        WHERE em.campanha_id = p_campanha_id AND em.tipo = p_tipo;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_estado_mestre(uuid,text,jsonb,bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.salvar_estado_mestre(uuid,text,jsonb,bigint) TO authenticated;
COMMIT;
