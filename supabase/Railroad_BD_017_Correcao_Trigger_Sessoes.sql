-- Railroad RPG | 017 - Corrigir funcao de trigger compartilhada
-- Aplicar apos SQL 016. Nao altera dados existentes.
-- 013 passou a exigir NEW.revisao para todas as tabelas que usam
-- atualizar_data_ficha(); sessoes nao possui essa coluna.
BEGIN;

-- Fichas: mantem incremento automatico de revisao para as RPCs do Jogador.
CREATE OR REPLACE FUNCTION public.atualizar_revisao_ficha_jogador()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  NEW.revisao := OLD.revisao + 1;
  RETURN NEW;
END;
$$;

-- Tabelas legadas (sessoes e npcs): somente carimbo de atualizacao.
-- NPCs ja incrementam revisao explicitamente nas RPCs do Mestre.
CREATE OR REPLACE FUNCTION public.atualizar_data_ficha()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

-- Alterar apenas o trigger de fichas para a funcao especializada.
DROP TRIGGER IF EXISTS fichas_atualizadas_em ON public.fichas;
CREATE TRIGGER fichas_atualizadas_em
BEFORE UPDATE ON public.fichas
FOR EACH ROW EXECUTE FUNCTION public.atualizar_revisao_ficha_jogador();

COMMIT;
