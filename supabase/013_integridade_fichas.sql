-- Railroad RPG | 013 - Revisão transacional das fichas (Jogador).
-- Dependência: executar após 001..012. Migração aditiva e idempotente.
-- Rodar ANTES de publicar a versão do Jogador que usa as RPCs abaixo.
-- Não apaga, converte nem reescreve o conteúdo de fichas existentes.
-- A permissão UPDATE legada permanece nesta fase para não quebrar clientes em cache;
-- o bloqueio das escritas diretas fica para uma etapa posterior de publicação.
BEGIN;

ALTER TABLE public.fichas
  ADD COLUMN IF NOT EXISTS revisao bigint NOT NULL DEFAULT 1;

-- Coluna criada com DEFAULT 1; CHECK também protege futuras atualizações.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.fichas'::regclass
      AND conname = 'fichas_revisao_positiva'
  ) THEN
    ALTER TABLE public.fichas
      ADD CONSTRAINT fichas_revisao_positiva CHECK (revisao > 0);
  END IF;
END $$;

-- A revisão é incrementada pelo PostgreSQL, inclusive em renomeações e
-- atualizações feitas por clientes antigos. O cliente não escolhe o valor.
CREATE OR REPLACE FUNCTION public.atualizar_data_ficha()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  NEW.revisao := OLD.revisao + 1;
  RETURN NEW;
END;
$$;
-- Reutiliza o trigger fichas_atualizadas_em já criado no SQL 001.

CREATE OR REPLACE FUNCTION public.salvar_ficha_jogador(
  p_ficha_id uuid, p_dados jsonb, p_revisao bigint
) RETURNS TABLE(id uuid, revisao bigint, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
  v_revisao bigint;
  v_atualizado timestamptz;
  v_usuario uuid := (SELECT auth.uid());
BEGIN
  IF v_usuario IS NULL OR p_ficha_id IS NULL OR p_revisao IS NULL OR p_revisao < 1
      OR p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object' THEN
    RAISE EXCEPTION 'Parâmetros inválidos para salvar a ficha.' USING ERRCODE = '22023';
  END IF;
  -- Proteção proporcional; não transfere imagens nem converte JSONB nesta etapa.
  IF octet_length(p_dados::text) > 20000000 THEN
    RAISE EXCEPTION 'A ficha excede o limite de 20 MB. Exporte o JSON e reduza as imagens.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.fichas AS f SET dados = p_dados
    WHERE f.id = p_ficha_id
      AND f.usuario_id = v_usuario
      AND f.revisao = p_revisao
    RETURNING f.id, f.revisao, f.updated_at
      INTO v_id, v_revisao, v_atualizado;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conflito: ficha modificada, removida ou não disponível. Seu rascunho não foi alterado.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT v_id, v_revisao, v_atualizado;
END;
$$;

CREATE OR REPLACE FUNCTION public.renomear_ficha_jogador(
  p_ficha_id uuid, p_titulo text, p_revisao bigint
) RETURNS TABLE(id uuid, titulo text, revisao bigint, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
  v_titulo text;
  v_revisao bigint;
  v_atualizado timestamptz;
  v_usuario uuid := (SELECT auth.uid());
BEGIN
  IF v_usuario IS NULL OR p_ficha_id IS NULL OR p_revisao IS NULL OR p_revisao < 1
     OR p_titulo IS NULL OR char_length(btrim(p_titulo)) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'Parâmetros inválidos para renomear a ficha.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.fichas AS f SET titulo = btrim(p_titulo)
    WHERE f.id = p_ficha_id
      AND f.usuario_id = v_usuario
      AND f.revisao = p_revisao
    RETURNING f.id, f.titulo, f.revisao, f.updated_at
      INTO v_id, v_titulo, v_revisao, v_atualizado;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conflito: ficha modificada, removida ou não disponível. Renomeação não aplicada.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT v_id, v_titulo, v_revisao, v_atualizado;
END;
$$;

-- Em PostgreSQL, funções possuem EXECUTE para PUBLIC por padrão.
REVOKE ALL ON FUNCTION public.salvar_ficha_jogador(uuid,jsonb,bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.renomear_ficha_jogador(uuid,text,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_ficha_jogador(uuid,jsonb,bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.renomear_ficha_jogador(uuid,text,bigint) TO authenticated;

COMMIT;

-- Atualiza o catálogo da API para descobrir as duas funções RPC.
NOTIFY pgrst, 'reload schema';
