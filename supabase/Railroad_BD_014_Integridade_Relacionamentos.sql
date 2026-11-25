-- Railroad RPG | 014 - Integridade dos vínculos de campanhas.
-- Requer 001..013. Não altera os dados das fichas nem as permissões RLS.
-- Execute primeiro o diagnóstico 014. Faça backup antes de executar.
-- Em caso de vínculos inconsistentes, aborta SEM modificar o banco.
BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.campanha_fichas cf
    JOIN public.campanha_convites cc ON cc.id = cf.convite_id
    WHERE cf.campanha_id IS DISTINCT FROM cc.campanha_id
  ) THEN
    RAISE EXCEPTION '014 interrompida: existem envios com convite de outra campanha. Corrija os dados antes de migrar.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.campanha_fichas cf
    JOIN public.campanha_convites cc ON cc.id = cf.convite_id
    JOIN public.fichas f ON f.id = cf.ficha_id
    WHERE f.usuario_id IS DISTINCT FROM cc.jogador_id
  ) THEN
    RAISE EXCEPTION '014 interrompida: existem envios de fichas de outro jogador. Corrija os dados antes de migrar.';
  END IF;
END $$;
-- Uma chave estrangeira composta exige UNIQUE nas colunas referenciadas.
-- Não substitui a PK existente nem modifica os IDs.
CREATE UNIQUE INDEX IF NOT EXISTS campanha_convites_id_campanha_uniq_idx
  ON public.campanha_convites (id, campanha_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.campanha_fichas'::regclass
      AND conname = 'campanha_fichas_convite_mesma_campanha_fk'
  ) THEN
    ALTER TABLE public.campanha_fichas
      ADD CONSTRAINT campanha_fichas_convite_mesma_campanha_fk
      FOREIGN KEY (convite_id, campanha_id)
      REFERENCES public.campanha_convites (id, campanha_id)
      ON DELETE CASCADE;
  END IF;
END $$;
-- Valida também que a ficha pertence ao jogador do convite.
-- Trigger de integridade; NÃO substitui as verificações de autorização das RPCs.
CREATE OR REPLACE FUNCTION public.validar_vinculo_ficha_campanha()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_jogador uuid;
  v_proprietario uuid;
BEGIN
  SELECT cc.jogador_id INTO v_jogador
    FROM public.campanha_convites cc
    WHERE cc.id = NEW.convite_id AND cc.campanha_id = NEW.campanha_id;
  IF v_jogador IS NULL THEN
    RAISE EXCEPTION 'Convite inexistente ou de outra campanha.' USING ERRCODE = '23503';
  END IF;
  SELECT f.usuario_id INTO v_proprietario
    FROM public.fichas f WHERE f.id = NEW.ficha_id;
  IF v_proprietario IS DISTINCT FROM v_jogador THEN
    RAISE EXCEPTION 'A ficha deve pertencer ao jogador convidado.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS campanha_fichas_validar_proprietario ON public.campanha_fichas;
CREATE TRIGGER campanha_fichas_validar_proprietario
  BEFORE INSERT OR UPDATE OF convite_id, campanha_id, ficha_id
  ON public.campanha_fichas FOR EACH ROW
  EXECUTE FUNCTION public.validar_vinculo_ficha_campanha();
-- Se o dono da ficha ou o jogador do convite mudar por operações administrativas,
-- os triggers abaixo impedem que vínculos existentes fiquem inconsistentes.
CREATE OR REPLACE FUNCTION public.impedir_mudanca_dono_ficha_vinculada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.usuario_id IS DISTINCT FROM NEW.usuario_id AND EXISTS (
    SELECT 1 FROM public.campanha_fichas cf WHERE cf.ficha_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível alterar o proprietário de uma ficha vinculada.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS fichas_impedir_mudanca_dono_vinculada ON public.fichas;
CREATE TRIGGER fichas_impedir_mudanca_dono_vinculada
  BEFORE UPDATE OF usuario_id ON public.fichas FOR EACH ROW
  EXECUTE FUNCTION public.impedir_mudanca_dono_ficha_vinculada();
CREATE OR REPLACE FUNCTION public.impedir_mudanca_jogador_convite_vinculado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.jogador_id IS DISTINCT FROM NEW.jogador_id AND EXISTS (
    SELECT 1 FROM public.campanha_fichas cf WHERE cf.convite_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível alterar o jogador de um convite com fichas vinculadas.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS convites_impedir_mudanca_jogador_vinculado ON public.campanha_convites;
CREATE TRIGGER convites_impedir_mudanca_jogador_vinculado
  BEFORE UPDATE OF jogador_id ON public.campanha_convites FOR EACH ROW
  EXECUTE FUNCTION public.impedir_mudanca_jogador_convite_vinculado();
-- A função de trigger não precisa estar disponível na Data API.
REVOKE ALL ON FUNCTION public.validar_vinculo_ficha_campanha() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.impedir_mudanca_dono_ficha_vinculada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.impedir_mudanca_jogador_convite_vinculado() FROM PUBLIC, anon, authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
