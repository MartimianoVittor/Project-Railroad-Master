/** Modelo das fichas privadas de NPCs, sem dependências de interface ou banco. */
export const TRACOS_NPC = Object.freeze([
    'Sangue Quente', 'Mira Afiada', 'Guerreiro Ancestral', 'Amigo Kaboom',
    'Orelha Em Pé', 'Passos Na Sombra', 'Poeira e Ossos', 'Rédea e Sela',
    'Língua de Trapo', 'Agourento e Carrancudo', 'Cachola Cheia', 'Grande Maioral',
]);

export const CONDICOES_NPC = Object.freeze([
    ['ferimentos', 'Ferimentos'], ['sede', 'Sede'],
    ['fome', 'Fome'], ['cansaco', 'Cansaço'],
]);

export const ARMAS_NPC = Object.freeze([
    ['primaria', 'Primária'], ['secundaria', 'Secundária'],
]);

export const DISTANCIAS_NPC = Object.freeze([
    ['corpo', 'Corpo a corpo'], ['curta', 'Curta'],
    ['media', 'Média'], ['longa', 'Longa'],
]);

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

function normalizarArma(dados = {}) {
    const bonus = {};
    for (const [chave] of DISTANCIAS_NPC) {
        bonus[chave] = inteiro(dados.bonus?.[chave], -3, 3, 0);
    }
    return {
        nome: limitar(dados.nome, 100),
        municao: inteiro(dados.municao, 0, 9999, 0),
        bonus,
    };
}

/** Valida e limita todos os campos, inclusive registros recuperados do navegador. */
export function normalizarNpc(dados = {}) {
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
        imagemJogador: typeof dados.imagemJogador === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(dados.imagemJogador) && dados.imagemJogador.length <= 500000 ? dados.imagemJogador : '',
        capacidadePersonagem: inteiro(dados.capacidadePersonagem, 0, 99999, 0),
        capacidadeMontaria: inteiro(dados.capacidadeMontaria, 0, 99999, 0),
        itens: Array.isArray(dados.itens) ? dados.itens.slice(0, 200).map(item => ({
            local: item.local === 'montaria' ? 'montaria' : 'personagem',
            nome: limitar(item.nome, 120),
            quantidade: inteiro(item.quantidade, 0, 9999, 0),
            tamanho: inteiro(item.tamanho, 0, 9999, 0),
            descricao: limitar(item.descricao, 1000),
        })) : [],
        imagem: typeof dados.imagem === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(dados.imagem) && dados.imagem.length <= 500000 ? dados.imagem : '',
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
