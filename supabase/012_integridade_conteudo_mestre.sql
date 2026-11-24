-- Railroad Mestre | 012 - Gravação atômica do Diário e revisões dos NPCs.
-- Executar UMA VEZ após 001..011 no mesmo Supabase da plataforma do Jogador.
-- Aditiva: não exclui fichas, campanhas, NPCs nem sessões existentes.
-- Publicar esta migração ANTES de atualizar a aplicação estática.
BEGIN;

ALTER TABLE public.npcs
  ADD COLUMN IF NOT EXISTS revisao bigint NOT NULL DEFAULT 1 CHECK (revisao > 0);

CREATE TABLE IF NOT EXISTS public.diarios_mestre (
  campanha_id uuid PRIMARY KEY REFERENCES public.campanhas(id) ON DELETE CASCADE,
  revisao bigint NOT NULL DEFAULT 1 CHECK (revisao > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.diarios_mestre ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diarios_mestre FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.diarios_mestre TO authenticated;

DROP POLICY IF EXISTS diarios_mestre_select ON public.diarios_mestre;
CREATE POLICY diarios_mestre_select ON public.diarios_mestre FOR SELECT TO authenticated
  USING (railroad_private.mestre_possui_campanha(campanha_id));
DROP POLICY IF EXISTS diarios_mestre_insert ON public.diarios_mestre;
CREATE POLICY diarios_mestre_insert ON public.diarios_mestre FOR INSERT TO authenticated
  WITH CHECK (railroad_private.mestre_possui_campanha(campanha_id));
DROP POLICY IF EXISTS diarios_mestre_update ON public.diarios_mestre;
CREATE POLICY diarios_mestre_update ON public.diarios_mestre FOR UPDATE TO authenticated
  USING (railroad_private.mestre_possui_campanha(campanha_id))
  WITH CHECK (railroad_private.mestre_possui_campanha(campanha_id));

-- Uma única instrução SQL traz a mesma fotografia das sessões e da revisão.
CREATE OR REPLACE FUNCTION public.ler_diario_mestre(p_campanha_id uuid)
RETURNS TABLE(sessoes jsonb, ativa_id uuid, revisao bigint, salvo_em timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT
    COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', s.id, 'nome', s.nome, 'descricao', s.descricao,
      'notas', s.notas, 'quadro', s.quadro
    ) ORDER BY s.posicao, s.created_at) FROM public.sessoes AS s
    WHERE s.campanha_id = p_campanha_id), '[]'::jsonb),
    (SELECT s.id FROM public.sessoes AS s
     WHERE s.campanha_id = p_campanha_id AND s.ativa
     LIMIT 1),
    COALESCE((SELECT r.revisao FROM public.diarios_mestre AS r
              WHERE r.campanha_id = p_campanha_id), 0::bigint),
    (SELECT max(s.updated_at) FROM public.sessoes AS s
     WHERE s.campanha_id = p_campanha_id)
  WHERE railroad_private.mestre_possui_campanha(p_campanha_id);
$$;
REVOKE ALL ON FUNCTION public.ler_diario_mestre(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ler_diario_mestre(uuid) TO authenticated;

-- Uma chamada RPC executa todas as alterações em uma única transação PostgreSQL.
-- Se houver erro, conflito ou queda de conexão, nenhuma etapa é confirmada isoladamente.
CREATE OR REPLACE FUNCTION public.salvar_diario_mestre(
  p_campanha_id uuid, p_sessoes jsonb, p_ativa_id uuid,
  p_ids_conhecidos uuid[], p_revisao bigint
) RETURNS TABLE(revisao bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_sessao jsonb;
  v_id uuid;
  v_ids uuid[] := '{}'::uuid[];
  v_nome text;
  v_descricao text;
  v_notas text;
  v_quadro jsonb;
  v_posicao integer := 0;
  v_revisao bigint;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_campanha_id IS NULL
     OR p_sessoes IS NULL OR jsonb_typeof(p_sessoes) <> 'array'
     OR jsonb_array_length(p_sessoes) > 200
     OR octet_length(p_sessoes::text) > 20000000
     OR p_revisao IS NULL OR p_revisao < 0 THEN
    RAISE EXCEPTION 'Parâmetros inválidos para salvar o Diário.';
  END IF;
  IF NOT railroad_private.mestre_possui_campanha(p_campanha_id) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão.';
  END IF;
  IF p_revisao = 0 THEN
    INSERT INTO public.diarios_mestre(campanha_id,revisao)
    VALUES (p_campanha_id,1)
    ON CONFLICT (campanha_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conflito: o Diário mudou em outra aba. Recarregue as sessões antes de salvar.';
    END IF;
    v_revisao := 1;
  ELSE
    UPDATE public.diarios_mestre AS d
      SET revisao = d.revisao + 1, updated_at = now()
      WHERE d.campanha_id = p_campanha_id AND d.revisao = p_revisao
      RETURNING d.revisao INTO v_revisao;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conflito: as sessões foram alteradas em outra aba ou dispositivo. Não foram sobrescritas.';
    END IF;
  END IF;

  -- A restrição de sessão ativa é imediata: limpar antes de definir a nova.
  UPDATE public.sessoes SET ativa = false
    WHERE campanha_id = p_campanha_id AND ativa;

  FOR v_sessao IN SELECT value FROM jsonb_array_elements(p_sessoes)
  LOOP
    IF jsonb_typeof(v_sessao) <> 'object' THEN
      RAISE EXCEPTION 'Sessão inválida: era esperado um objeto.';
    END IF;
    v_id := (v_sessao->>'id')::uuid;
    IF v_id IS NULL OR v_id = ANY(v_ids) THEN
      RAISE EXCEPTION 'Sessão sem identificação ou duplicada.';
    END IF;
    v_ids := array_append(v_ids, v_id);
    v_nome := COALESCE(v_sessao->>'nome', '');
    v_descricao := COALESCE(v_sessao->>'descricao', '');
    v_notas := COALESCE(v_sessao->>'notas', '');
    v_quadro := COALESCE(v_sessao->'quadro', '{}'::jsonb);
    IF char_length(v_nome) > 80 OR char_length(v_descricao) > 25
       OR char_length(v_notas) > 50000 OR jsonb_typeof(v_quadro) <> 'object' THEN
      RAISE EXCEPTION 'Sessão com campos inválidos ou acima do limite.';
    END IF;
    INSERT INTO public.sessoes AS s
      (id,campanha_id,nome,descricao,notas,quadro,posicao,ativa)
    VALUES (v_id,p_campanha_id,v_nome,v_descricao,v_notas,v_quadro,
            v_posicao,v_id = p_ativa_id)
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome, descricao = EXCLUDED.descricao,
      notas = EXCLUDED.notas, quadro = EXCLUDED.quadro,
      posicao = EXCLUDED.posicao, ativa = EXCLUDED.ativa
    WHERE s.campanha_id = p_campanha_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Uma sessão pertence a outra campanha.';
    END IF;
    v_posicao := v_posicao + 1;
  END LOOP;
  IF p_ativa_id IS NOT NULL AND NOT (p_ativa_id = ANY(v_ids)) THEN
    RAISE EXCEPTION 'Sessão ativa não encontrada na lista.';
  END IF;
  -- Só apaga sessões conhecidas na leitura original; não apaga registros novos
  -- de clientes antigos que ainda não usam o controle de revisão.
  DELETE FROM public.sessoes AS s WHERE s.campanha_id = p_campanha_id
    AND s.id = ANY(COALESCE(p_ids_conhecidos, '{}'::uuid[]))
    AND NOT (s.id = ANY(v_ids));
  RETURN QUERY SELECT v_revisao;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_diario_mestre(uuid,jsonb,uuid,uuid[],bigint)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.salvar_diario_mestre(uuid,jsonb,uuid,uuid[],bigint)
  TO authenticated;

-- A mesma revisão acompanha NPCs individuais e NPCs gravados ao encerrar combate.
CREATE OR REPLACE FUNCTION public.salvar_npc_mestre(
  p_campanha_id uuid, p_npc_id uuid, p_nome text,
  p_dados jsonb, p_revisao bigint
) RETURNS TABLE(revisao bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_revisao bigint;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_campanha_id IS NULL OR p_npc_id IS NULL
     OR p_nome IS NULL OR char_length(p_nome) > 100
     OR p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object'
     OR octet_length(p_dados::text) > 1000000
     OR p_revisao IS NULL OR p_revisao < 0 THEN
    RAISE EXCEPTION 'Parâmetros inválidos para salvar o NPC.';
  END IF;
  IF NOT railroad_private.mestre_possui_campanha(p_campanha_id) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão.';
  END IF;
  IF p_revisao = 0 THEN
    INSERT INTO public.npcs(id,campanha_id,nome,dados,revisao)
      VALUES (p_npc_id,p_campanha_id,p_nome,p_dados,1)
      ON CONFLICT (id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conflito: o NPC já existe. Recarregue os NPCs antes de salvar.';
    END IF;
    v_revisao := 1;
  ELSE
    UPDATE public.npcs AS n SET nome = p_nome, dados = p_dados,
      revisao = n.revisao + 1
      WHERE n.campanha_id = p_campanha_id AND n.id = p_npc_id
        AND n.revisao = p_revisao
      RETURNING n.revisao INTO v_revisao;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conflito: o NPC foi alterado ou removido em outro dispositivo.';
    END IF;
  END IF;
  RETURN QUERY SELECT v_revisao;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_npc_mestre(uuid,uuid,text,jsonb,bigint)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.salvar_npc_mestre(uuid,uuid,text,jsonb,bigint)
  TO authenticated;

-- Encerramento do combate: gravação de todos os NPCs ou de nenhum.
CREATE OR REPLACE FUNCTION public.salvar_npcs_combate_mestre(
  p_campanha_id uuid, p_npcs jsonb
) RETURNS TABLE(id uuid, revisao bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_item jsonb;
  v_id uuid;
  v_nome text;
  v_dados jsonb;
  v_revisao bigint;
  v_nova bigint;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_campanha_id IS NULL
     OR p_npcs IS NULL OR jsonb_typeof(p_npcs) <> 'array'
     OR jsonb_array_length(p_npcs) > 200
     OR octet_length(p_npcs::text) > 20000000 THEN
    RAISE EXCEPTION 'Dados inválidos para salvar os NPCs do combate.';
  END IF;
  IF NOT railroad_private.mestre_possui_campanha(p_campanha_id) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão.';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_npcs)
  LOOP
    v_id := (v_item->>'id')::uuid;
    v_nome := v_item->>'nome';
    v_dados := v_item->'dados';
    v_revisao := (v_item->>'revisao')::bigint;
    IF v_id IS NULL OR v_nome IS NULL OR char_length(v_nome) > 100
       OR v_dados IS NULL OR jsonb_typeof(v_dados) <> 'object'
       OR v_revisao IS NULL OR v_revisao < 1 THEN
      RAISE EXCEPTION 'NPC do combate sem revisão ou com dados inválidos.';
    END IF;
    UPDATE public.npcs AS n SET nome = v_nome, dados = v_dados,
      revisao = n.revisao + 1
      WHERE n.campanha_id = p_campanha_id AND n.id = v_id
        AND n.revisao = v_revisao
      RETURNING n.revisao INTO v_nova;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conflito: um NPC foi alterado ou removido. Nenhum NPC do combate foi atualizado.';
    END IF;
    id := v_id;
    revisao := v_nova;
    RETURN NEXT;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_npcs_combate_mestre(uuid,jsonb)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.salvar_npcs_combate_mestre(uuid,jsonb)
  TO authenticated;

COMMIT;
