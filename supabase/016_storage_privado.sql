-- Railroad RPG | 016 | Imagens privadas para Jogador e Mestre
-- Dependencias: SQL 001..015, Supabase Storage habilitado.
-- Execute como administrador no SQL Editor, ANTES de publicar os PATCHs 016.
-- Nao altera dados JSONB, nao exclui imagens antigas e nao concede leitura publica.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('railroad-imagens', 'railroad-imagens', false, 8388608,
        ARRAY['image/png','image/jpeg','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- As funcoes SECURITY DEFINER consultam ownership sem exigir SELECT direto
-- em campanhas/convites, cujas permissoes da API sao intencionalmente revogadas.
CREATE OR REPLACE FUNCTION railroad_private.pode_ler_imagem_railroad(p_nome text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RETURN false; END IF;
  IF p_nome ~* '^fichas/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' THEN
    v_id := split_part(p_nome, '/', 2)::uuid;
    RETURN EXISTS (
      SELECT 1 FROM public.fichas f
      WHERE f.id = v_id AND (
        f.usuario_id = (SELECT auth.uid())
        OR railroad_private.mestre_pode_ler_ficha(f.id)
      )
    );
  ELSIF p_nome ~* '^campanhas/[0-9a-f-]{36}/(npcs|sessoes|estados)/[a-z0-9-]{1,100}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' THEN
    v_id := split_part(p_nome, '/', 2)::uuid;
    RETURN railroad_private.mestre_possui_campanha(v_id);
  END IF;
  RETURN false;
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION railroad_private.pode_inserir_imagem_railroad(p_nome text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RETURN false; END IF;
  IF p_nome ~* '^fichas/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' THEN
    v_id := split_part(p_nome, '/', 2)::uuid;
    RETURN EXISTS (SELECT 1 FROM public.fichas f WHERE f.id = v_id
       AND f.usuario_id = (SELECT auth.uid()));
  ELSIF p_nome ~* '^campanhas/[0-9a-f-]{36}/(npcs|sessoes|estados)/[a-z0-9-]{1,100}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' THEN
    v_id := split_part(p_nome, '/', 2)::uuid;
    RETURN railroad_private.mestre_possui_campanha(v_id);
  END IF;
  RETURN false;
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION railroad_private.pode_ler_imagem_railroad(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION railroad_private.pode_inserir_imagem_railroad(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION railroad_private.pode_ler_imagem_railroad(text) TO authenticated;
GRANT EXECUTE ON FUNCTION railroad_private.pode_inserir_imagem_railroad(text) TO authenticated;

DROP POLICY IF EXISTS railroad_imagens_select ON storage.objects;
CREATE POLICY railroad_imagens_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'railroad-imagens' AND railroad_private.pode_ler_imagem_railroad(name));

DROP POLICY IF EXISTS railroad_imagens_insert ON storage.objects;
CREATE POLICY railroad_imagens_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'railroad-imagens' AND railroad_private.pode_inserir_imagem_railroad(name));

-- Nao ha UPDATE (upsert) nem DELETE: uploads sao imutaveis. Deletar
-- imagens automaticamente pode quebrar rascunhos, copias ou links existentes.
-- Nunca crie politicas anon/public para este bucket.
COMMIT;
