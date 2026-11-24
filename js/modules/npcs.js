/** Modelo das fichas privadas de NPCs, sem dependências de interface ou banco. */
import {
    ARMAS as ARMAS_NPC, CONDICOES as CONDICOES_NPC,
    DISTANCIAS as DISTANCIAS_NPC, TRACOS as TRACOS_NPC,
} from './ficha/campos.js?v=mesa-31';

export { ARMAS_NPC, CONDICOES_NPC, DISTANCIAS_NPC, TRACOS_NPC };

export const NIVEIS_NPC = Object.freeze([
    '0 · Incapaz', '1 · Incompetente (d4)', '2 · Mundano (d6)',
    '3 · Treinado (d8)', '4 · Especialista (d12)',
]);

export const LIMITE_NPCS = 200;

const limitar = (valor, tamanho) => Array.from(typeof valor === 'string' ? valor.trim() : '').slice(0, tamanho).join('');
const inteiro = (valor, minimo, maximo, padrao) => {
    if (valor === '' || valor === null || valor === undefined) return padrao;
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, Math.trunc(numero))) : padrao;
};
const novoId = () => globalThis.crypto?.randomUUID?.()
    ?? `npc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function normalizarArma(dados) {
    const bonus = {};
    for (const [chave] of DISTANCIAS_NPC) {
        bonus[chave] = inteiro(dados?.bonus?.[chave], -3, 3, 0);
    }
    return {
        nome: limitar(dados?.nome, 100),
        municao: inteiro(dados?.municao, 0, 9999, 0),
        bonus,
    };
}

function normalizarItens(itens) {
    if (!Array.isArray(itens)) return [];
    return itens.slice(0, 200)
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            local: item.local === 'montaria' ? 'montaria' : 'personagem',
            nome: limitar(item.nome, 120),
            quantidade: inteiro(item.quantidade, 0, 9999, 0),
            tamanho: inteiro(item.tamanho, 0, 9999, 0),
            descricao: limitar(item.descricao, 1000),
        }));
}

const IMAGEM_EMBUTIDA = /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/;
function normalizarImagem(imagem) {
    return typeof imagem === 'string' && imagem.length <= 500000 && IMAGEM_EMBUTIDA.test(imagem) ? imagem : '';
}

/** Valida e limita todos os campos, inclusive registros recuperados do navegador. */
export function normalizarNpc(origem) {
    const dados = origem ?? {};
    const tracos = {};
    for (const nome of TRACOS_NPC) {
        tracos[nome] = inteiro(dados.tracos?.[nome], 0, 4, 2);
    }
    const condicoes = {};
    for (const [chave] of CONDICOES_NPC) {
        condicoes[chave] = inteiro(dados.condicoes?.[chave], 0, 3, 0);
    }
    const principal = TRACOS_NPC.includes(dados.tracoPrincipal)
        ? dados.tracoPrincipal : 'Orelha Em Pé';
    const armas = {};
    for (const [chave] of ARMAS_NPC) {
        armas[chave] = normalizarArma(dados.armas?.[chave]);
    }

    return {
        id: typeof dados.id === 'string' && dados.id.length <= 100 && dados.id
            ? dados.id : novoId(),
        tipo: dados.tipo === 'completa' ? 'completa' : 'simples',
        nome: limitar(dados.nome, 100),
        apelido: limitar(dados.apelido, 80),
        nomeJogador: limitar(dados.nomeJogador, 100),
        apelidoJogador: limitar(dados.apelidoJogador, 80),
        bioJogador: limitar(dados.bioJogador, 1000),
        imagemJogador: normalizarImagem(dados.imagemJogador),
        capacidadePersonagem: inteiro(dados.capacidadePersonagem, 0, 99999, 0),
        capacidadeMontaria: inteiro(dados.capacidadeMontaria, 0, 99999, 0),
        itens: normalizarItens(dados.itens),
        imagem: normalizarImagem(dados.imagem),
        papel: limitar(dados.papel, 100),
        descricao: limitar(dados.descricao, 1000),
        notas: limitar(dados.notas, 8000),
        tracoPrincipal: principal,
        nivelPrincipal: inteiro(dados.nivelPrincipal, 0, 4, 2),
        profissao: limitar(dados.profissao, 200),
        linguas: limitar(dados.linguas, 200),
        fama: limitar(dados.fama, 100),
        palavra: limitar(dados.palavra, 100),
        dinheiro: limitar(dados.dinheiro, 100),
        tracos,
        condicoes,
        armas,
        inventario: limitar(dados.inventario, 8000),
        revisao: inteiro(dados.revisao, 0, Number.MAX_SAFE_INTEGER, 0),
        atualizadoEm: typeof dados.atualizadoEm === 'string' ? dados.atualizadoEm : null,
    };
}

export function criarNpc(tipo = 'simples') {
    return normalizarNpc({ id: novoId(), tipo });
}

export function validarNpc(npc) {
    if (!npc.nome) throw new Error('Informe o nome do NPC.');
    if (!['simples', 'completa'].includes(npc.tipo)) throw new Error('Tipo de ficha inválido.');
    return npc;
}

export function rotuloNivelNpc(nivel) {
    return NIVEIS_NPC[inteiro(nivel, 0, 4, 0)];
}
