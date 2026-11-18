/**
 * Sessões privadas por conta e campanha. O armazenamento é local nesta etapa;
 * a interface não presume que as anotações já estejam sincronizadas online.
 */
const PREFIXO = 'railroad_mestre_sessoes:v2';
const PREFIXO_ANTIGO = 'railroad_mestre_rascunho:v1';
const LIMITE_NOTAS = 50000;
const LIMITE_SESSOES = 200;
export const LIMITE_NOME_SESSAO = 80;
export const LIMITE_DESCRICAO_SESSAO = 25;

const limitarCaracteres = (valor, limite) => Array.from(typeof valor === 'string' ? valor.trim() : '').slice(0, limite).join('');

export function criarSessao(origem = {}) {
    const id = globalThis.crypto?.randomUUID?.() ?? `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
        id,
        nome: limitarCaracteres(origem.nome, LIMITE_NOME_SESSAO),
        descricao: limitarCaracteres(origem.descricao, LIMITE_DESCRICAO_SESSAO),
        notas: typeof origem.notas === 'string' ? origem.notas.slice(0, LIMITE_NOTAS) : '',
        quadro: normalizarQuadro(origem.quadro),
    };
}

function normalizarQuadro(quadro) {
    if (!quadro || typeof quadro !== 'object') return { desenhoCanvas: '', itensQuadro: [] };
    const desenhoCanvas = typeof quadro.desenhoCanvas === 'string' && quadro.desenhoCanvas.startsWith('data:image/')
        ? quadro.desenhoCanvas : '';
    const itensQuadro = Array.isArray(quadro.itensQuadro)
        ? quadro.itensQuadro.filter((item) => item && ['texto', 'imagem'].includes(item.tipo)).slice(0, 120).map((item) => ({
            tipo: item.tipo,
            x: Math.max(0, Math.min(100, Number(item.x) || 0)),
            y: Math.max(0, Math.min(100, Number(item.y) || 0)),
            largura: Math.max(5, Math.min(100, Number(item.largura) || 25)),
            texto: item.tipo === 'texto' ? String(item.texto || '').slice(0, 2000) : '',
            cor: typeof item.cor === 'string' ? item.cor : '#3d2314',
            tamanho: Math.max(10, Math.min(90, Number(item.tamanho) || 18)),
            src: item.tipo === 'imagem' && typeof item.src === 'string' && item.src.startsWith('data:image/') ? item.src : '',
        })).filter((item) => item.tipo !== 'imagem' || item.src)
        : [];
    return { desenhoCanvas, itensQuadro };
}

function normalizar(dados = {}) {
    const sessoes = Array.isArray(dados.sessoes)
        ? dados.sessoes.slice(0, LIMITE_SESSOES).map((sessao) => ({
            id: typeof sessao.id === 'string' && sessao.id ? sessao.id : criarSessao().id,
            nome: limitarCaracteres(sessao.nome, LIMITE_NOME_SESSAO),
            descricao: limitarCaracteres(sessao.descricao, LIMITE_DESCRICAO_SESSAO),
            notas: typeof sessao.notas === 'string' ? sessao.notas.slice(0, LIMITE_NOTAS) : '',
            quadro: normalizarQuadro(sessao.quadro),
        }))
        : [];
    return {
        sessoes,
        ativaId: sessoes.some((sessao) => sessao.id === dados.ativaId) ? dados.ativaId : sessoes[0]?.id ?? null,
        salvoEm: typeof dados.salvoEm === 'string' ? dados.salvoEm : null,
    };
}

export function duplicarSessao(sessoes, id) {
    const indice = sessoes.findIndex((sessao) => sessao.id === id);
    if (indice < 0 || sessoes.length >= LIMITE_SESSOES) return null;
    const copia = criarSessao(sessoes[indice]);
    copia.nome = limitarCaracteres(copia.nome ? `${copia.nome} (cópia)` : 'Cópia sem título', LIMITE_NOME_SESSAO);
    sessoes.splice(indice + 1, 0, copia);
    return copia;
}

/** Reposiciona uma sessão antes ou depois da sessão-alvo. */
export function moverSessao(sessoes, idOrigem, idDestino, posicao = 'antes') {
    const origem = sessoes.findIndex((sessao) => sessao.id === idOrigem);
    const destino = sessoes.findIndex((sessao) => sessao.id === idDestino);
    if (origem < 0 || destino < 0 || origem === destino || !['antes', 'depois'].includes(posicao)) return false;
    const [sessao] = sessoes.splice(origem, 1);
    const novoDestino = sessoes.findIndex((item) => item.id === idDestino);
    sessoes.splice(novoDestino + (posicao === 'depois' ? 1 : 0), 0, sessao);
    return sessoes.findIndex((item) => item.id === idOrigem) !== origem;
}

export function criarRepositorioSessoes(armazenamento) {
    const chave = (usuarioId, campanhaId) => `${PREFIXO}:${usuarioId}:${campanhaId}`;
    const chaveAntiga = (usuarioId, campanhaId) => `${PREFIXO_ANTIGO}:${usuarioId}:${campanhaId}`;

    return {
        carregar(usuarioId, campanhaId) {
            if (!usuarioId || !campanhaId) return normalizar();
            try {
                const atual = armazenamento.getItem(chave(usuarioId, campanhaId));
                if (atual) return normalizar(JSON.parse(atual));
                const antigo = armazenamento.getItem(chaveAntiga(usuarioId, campanhaId));
                if (antigo) {
                    const dados = JSON.parse(antigo);
                    const notas = [dados.anotacoes, dados.ideias ? `Ideias do rascunho anterior:\n${dados.ideias}` : '']
                        .filter((valor) => typeof valor === 'string' && valor.trim()).join('\n\n');
                    if (notas) {
                        const sessao = criarSessao({ notas });
                        return normalizar({ sessoes: [sessao], ativaId: sessao.id, salvoEm: dados.salvoEm });
                    }
                }
            } catch {
                // Um registro danificado não bloqueia o acesso ao restante da mesa.
            }
            return normalizar();
        },
        salvar(usuarioId, campanhaId, dados) {
            if (!usuarioId || !campanhaId) throw new Error('Selecione uma campanha antes de salvar.');
            const atualizado = normalizar({ ...dados, salvoEm: new Date().toISOString() });
            try {
                armazenamento.setItem(chave(usuarioId, campanhaId), JSON.stringify(atualizado));
            } catch (erro) {
                throw new Error('Não foi possível salvar neste navegador. O armazenamento pode estar cheio; reduza o tamanho das imagens do quadro e tente novamente.', { cause: erro });
            }
            return atualizado;
        },
    };
}
