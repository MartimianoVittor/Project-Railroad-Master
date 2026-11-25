-- Railroad RPG | 018 | Limpeza conservadora de imagens obsoletas do Diário.
-- Executar após 016 e 017. Nenhum registro ou objeto é apagado pela migração.
-- Só permite remoção de objetos antigos (>30 dias) que não estejam em nenhum quadro persistido.
BEGIN;
CREATE OR REPLACE FUNCTION railroad_private.pode_excluir_imagem_quadro_railroad(p_nome text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_campanha uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR
     p_nome !~* '^campanhas/[0-9a-f-]{36}/sessoes/[a-z0-9-]{1,100}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$'
  THEN RETURN false; END IF;
  v_campanha := split_part(p_nome, '/', 2)::uuid;
  IF NOT railroad_private.mestre_possui_campanha(v_campanha) THEN RETURN false; END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.sessoes s
    WHERE s.campanha_id = v_campanha
      AND strpos(s.quadro::text, p_nome) > 0
  );
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION railroad_private.pode_excluir_imagem_quadro_railroad(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION railroad_private.pode_excluir_imagem_quadro_railroad(text) TO authenticated;
DROP POLICY IF EXISTS railroad_imagens_delete_quadro_obsoleto ON storage.objects;
CREATE POLICY railroad_imagens_delete_quadro_obsoleto ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'railroad-imagens'
  AND created_at < now() - interval '30 days'
  AND railroad_private.pode_excluir_imagem_quadro_railroad(name)
);
COMMIT;
