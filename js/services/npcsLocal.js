import { normalizarReferencias } from './imagensStorage.js?v=mesa-44';
import { LIMITE_NPCS, normalizarNpc, validarNpc } from '../modules/npcs.js?v=mesa-44';

const PREFIXO = 'railroad_mestre_npcs:v1';

/**
 * NPCs são privados do mestre neste navegador, separados por conta e campanha.
 * O controlador coordena a cópia local com as operações remotas de conteudoCampanha.
 */
export function criarRepositorioNpcs(armazenamento) {
    const chave = (usuarioId, campanhaId) => `${PREFIXO}:${usuarioId}:${campanhaId}`;
    const exigirEscopo = (usuarioId, campanhaId) => {
        if (!usuarioId || !campanhaId) {
            throw new Error('Entre na sua conta e selecione uma campanha para gerenciar NPCs.');
        }
    };

    return {
        carregar(usuarioId, campanhaId) {
            if (!usuarioId || !campanhaId) return [];
            try {
                const texto = armazenamento.getItem(chave(usuarioId, campanhaId));
                if (!texto) return [];
                const dados = JSON.parse(texto);
                if (!Array.isArray(dados)) return [];
                const ids = new Set();
                return dados.slice(0, LIMITE_NPCS)
                    .map((npc) => normalizarNpc(npc))
                    .filter((npc) => {
                        if (!npc.nome || ids.has(npc.id)) return false;
                        ids.add(npc.id);
                        return true;
                    });
            } catch {
                // Um registro antigo danificado não bloqueia o restante da mesa.
                return [];
            }
        },

        salvar(usuarioId, campanhaId, lista) {
            exigirEscopo(usuarioId, campanhaId);
            if (!Array.isArray(lista) || lista.length > LIMITE_NPCS) {
                throw new Error(`Uma campanha pode ter no máximo ${LIMITE_NPCS} NPCs.`);
            }
            const ids = new Set();
            const normalizados = lista.map((item) => validarNpc(normalizarNpc(item)));
            for (const npc of normalizados) {
                if (ids.has(npc.id)) throw new Error('Foram encontradas fichas de NPC duplicadas.');
                ids.add(npc.id);
            }
            try {
                armazenamento.setItem(chave(usuarioId, campanhaId), JSON.stringify(normalizarReferencias(normalizados)));
            } catch (erro) {
                throw new Error('Não foi possível salvar os NPCs neste navegador. Verifique o espaço de armazenamento disponível.', { cause: erro });
            }
            return normalizados;
        },
    };
}
