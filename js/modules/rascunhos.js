const PREFIXO = 'railroad_mestre_rascunho:v1';
const LIMITE_CAMPO = 50000;

const rascunhoVazio = () => ({ anotacoes: '', ideias: '', salvoEm: null });

function normalizar(dados = {}) {
    return {
        anotacoes: typeof dados.anotacoes === 'string' ? dados.anotacoes.slice(0, LIMITE_CAMPO) : '',
        ideias: typeof dados.ideias === 'string' ? dados.ideias.slice(0, LIMITE_CAMPO) : '',
        salvoEm: typeof dados.salvoEm === 'string' ? dados.salvoEm : null,
    };
}

/**
 * Rascunhos privados neste navegador, associados à conta e à campanha.
 * O módulo pode ser substituído futuramente por RPCs de armazenamento online.
 */
export function criarRepositorioRascunhos(armazenamento) {
    const chave = (usuarioId, campanhaId) => `${PREFIXO}:${usuarioId}:${campanhaId}`;

    return {
        carregar(usuarioId, campanhaId) {
            if (!usuarioId || !campanhaId) return rascunhoVazio();
            try {
                const bruto = armazenamento.getItem(chave(usuarioId, campanhaId));
                return bruto ? normalizar(JSON.parse(bruto)) : rascunhoVazio();
            } catch {
                // Um rascunho antigo danificado não impede a abertura da campanha.
                return rascunhoVazio();
            }
        },

        salvar(usuarioId, campanhaId, dados) {
            if (!usuarioId || !campanhaId) throw new Error('Selecione uma campanha antes de salvar.');
            const rascunho = normalizar({ ...dados, salvoEm: new Date().toISOString() });
            armazenamento.setItem(chave(usuarioId, campanhaId), JSON.stringify(rascunho));
            return rascunho;
        },
    };
}
