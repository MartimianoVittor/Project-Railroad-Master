import { imagemSegura } from '../../services/imagensStorage.js?v=mesa-44';
/** Regras das sessões e normalização dos dados guardados. */
const LIMITE_NOTAS = 50000;
export const LIMITE_SESSOES = 200;
export const LIMITE_NOME_SESSAO = 80;
export const LIMITE_DESCRICAO_SESSAO = 25;

const limitarCaracteres = (valor, limite) => Array.from(typeof valor === 'string' ? valor.trim() : '').slice(0, limite).join('');

function novoId() {
    return globalThis.crypto?.randomUUID?.() ?? `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function criarSessao(origem = {}) {
    return normalizarSessao(origem, novoId());
}

function normalizarSessao(sessao, id) {
    return {
        id,
        nome: limitarCaracteres(sessao.nome, LIMITE_NOME_SESSAO),
        descricao: limitarCaracteres(sessao.descricao, LIMITE_DESCRICAO_SESSAO),
        notas: typeof sessao.notas === 'string' ? sessao.notas.slice(0, LIMITE_NOTAS) : '',
        quadro: normalizarQuadro(sessao.quadro),
    };
}

function normalizarQuadro(quadro) {
    if (!quadro || typeof quadro !== 'object') return { desenhoCanvas: '', itensQuadro: [] };
    const desenhoCanvas = imagemSegura(quadro.desenhoCanvas)
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
            src: item.tipo === 'imagem' && imagemSegura(item.src) ? item.src : '',
        })).filter((item) => item.tipo !== 'imagem' || item.src)
        : [];
    return { desenhoCanvas, itensQuadro };
}

export function normalizarDiario(dados) {
    const registros = Array.isArray(dados?.sessoes) ? dados.sessoes : [];
    const sessoes = registros.slice(0, LIMITE_SESSOES)
        .filter((sessao) => sessao && typeof sessao === 'object')
        .map((sessao) => normalizarSessao(sessao, typeof sessao.id === 'string' && sessao.id ? sessao.id : novoId()));
    return {
        sessoes,
        ativaId: sessoes.some((sessao) => sessao.id === dados.ativaId) ? dados.ativaId : sessoes[0]?.id ?? null,
        salvoEm: typeof dados?.salvoEm === 'string' ? dados.salvoEm : null,
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
