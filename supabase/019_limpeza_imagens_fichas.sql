-- Etapa 019: somente arquivos de fichas com mais de 30 dias e sem referência persistida.
-- Não apaga arquivos ao executar. Execute depois das migrações 016–018.
BEGIN;
CREATE OR REPLACE FUNCTION railroad_private.pode_excluir_imagem_ficha_railroad(p_nome text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_ficha uuid;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR p_nome !~* '^fichas/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' THEN RETURN false; END IF;
 v_ficha := split_part(p_nome,'/',2)::uuid;
 RETURN EXISTS (SELECT 1 FROM public.fichas f WHERE f.id=v_ficha AND f.usuario_id=(SELECT auth.uid()))
    AND NOT EXISTS (SELECT 1 FROM public.fichas f WHERE f.id=v_ficha AND strpos(f.dados::text,p_nome)>0);
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION railroad_private.pode_excluir_imagem_ficha_railroad(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION railroad_private.pode_excluir_imagem_ficha_railroad(text) TO authenticated;
DROP POLICY IF EXISTS railroad_imagens_delete_ficha_obsoleta ON storage.objects;
CREATE POLICY railroad_imagens_delete_ficha_obsoleta ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='railroad-imagens' AND created_at < now()-interval '30 days'
AND railroad_private.pode_excluir_imagem_ficha_railroad(name));
COMMIT;
