import { normalizarReferencias } from './imagensStorage.js?v=mesa-44';
import { criarSessao, normalizarDiario } from '../modules/diario/sessoes.js?v=mesa-44';
import { criarRepositorioRascunhos } from '../modules/rascunhos.js?v=mesa-44';

const PREFIXO = 'railroad_mestre_sessoes:v2';

export function criarRepositorioSessoes(armazenamento) {
    const chave = (usuarioId, campanhaId) => `${PREFIXO}:${usuarioId}:${campanhaId}`;
    const rascunhos = criarRepositorioRascunhos(armazenamento);

    return {
        carregar(usuarioId, campanhaId) {
            if (!usuarioId || !campanhaId) return normalizarDiario();
            try {
                const atual = armazenamento.getItem(chave(usuarioId, campanhaId));
                if (atual) return normalizarDiario(JSON.parse(atual));
                const antigo = rascunhos.carregar(usuarioId, campanhaId);
                const ideias = antigo.ideias ? `Ideias do rascunho anterior:\n${antigo.ideias}` : '';
                const notas = [antigo.anotacoes, ideias].filter((texto) => texto.trim()).join('\n\n');
                if (notas) {
                    const sessao = criarSessao({ notas });
                    return normalizarDiario({ sessoes: [sessao], ativaId: sessao.id, salvoEm: antigo.salvoEm });
                }
            } catch {
                // Um registro danificado não bloqueia o acesso ao restante da mesa.
            }
            return normalizarDiario();
        },
        salvar(usuarioId, campanhaId, dados) {
            if (!usuarioId || !campanhaId) throw new Error('Selecione uma campanha antes de salvar.');
            const atualizado = normalizarDiario({ ...dados, salvoEm: new Date().toISOString() });
            try {
                armazenamento.setItem(chave(usuarioId, campanhaId), JSON.stringify(normalizarReferencias(atualizado)));
            } catch (erro) {
                throw new Error('Não foi possível salvar neste navegador. O armazenamento pode estar cheio; reduza o tamanho das imagens do quadro e tente novamente.', { cause: erro });
            }
            return atualizado;
        },
    };
}
