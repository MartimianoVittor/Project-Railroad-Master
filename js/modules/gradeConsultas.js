/** Grade de células quadradas. O tamanho automático privilegia dimensões pares,
 * mas o usuário pode escolher qualquer número inteiro de células (inclusive ímpar).
 * O encaixe mantém a prioridade da peça arrastada, sem sobreposições. */
const inteiro = (valor, padrao) => Number.isFinite(Number(valor)) ? Math.trunc(Number(valor)) : padrao;
export const PARIDADE_GRADE = 1;
export const MIN_LADO_CARTAO = 4;
export const MAX_LINHAS_GRADE = 160;
export const MAX_COLUNAS_GRADE = 48;
export const LADO_ALVO_GRADE = 20;
export const ESPACAMENTO_GRADE = 6;
// Alturas iniciais padronizadas. Cartões cujo conteúdo excede oito células
// continuam podendo crescer para não ocultar tabelas nem texto.
export const ALTURAS_INICIAIS_GRADE = Object.freeze([4, 6, 8]);
export function alturaInicialCartao(linhas) {
    const minimoParaConteudo = passoPar(linhas, 4, MAX_LINHAS_GRADE);
    return ALTURAS_INICIAIS_GRADE.find((altura) => altura >= minimoParaConteudo)
        ?? minimoParaConteudo;
}
/** Seleciona uma proporção confortável para leitura, não a menor área bruta.
 * Favorece largura suficiente para títulos, parágrafos e tabelas, evitando
 * tanto cartões estreitos e altos quanto faixas exageradamente compridas.
 * Uma área moderadamente maior é aceitável quando melhora muito a leitura.
 * As medidas já são verificadas contra o conteúdo real pelo controlador. */
export function escolherTamanhoHorizontal(opcoes) {
    if (!Array.isArray(opcoes) || !opcoes.length) return { w:8, h:MIN_LADO_CARTAO, rolagemHorizontal:false };
    const semRolagem = opcoes.filter((p) => !p.rolagemHorizontal);
    const disponiveis = semRolagem.length ? semRolagem : opcoes;
    // Uma largura de leitura mínima evita colunas de texto excessivamente estreitas.
    // Em dispositivos pequenos usa a maior largura que a tela comportar.
    const maiorLargura = Math.max(...disponiveis.map((p) => p.w));
    const minimaLegivel = Math.min(6, maiorLargura);
    const candidatos = disponiveis.filter((p) => p.w >= minimaLegivel);
    const menorArea = Math.min(...candidatos.map((p) => p.w * p.h));
    const avaliados = candidatos.filter((p) => p.w * p.h <= menorArea * 2.1);
    const pontuar = (p) => {
        const areaRelativa = p.w * p.h / menorArea - 1;
        const proporcao = p.w / p.h;
        // 1,8:1 oferece espaço horizontal sem esticar muito o cartão.
        const desvioLeitura = Math.abs(Math.log(proporcao / 1.8));
        const larguraCurta = Math.max(0, 8 - p.w);
        const larguraExcessiva = Math.max(0, p.w - 14);
        const alturaLonga = Math.max(0, p.h - 8);
        return areaRelativa * 0.60 + desvioLeitura * 1.65
            + larguraCurta * 0.20 + larguraExcessiva * 0.12
            + alturaLonga * 0.05;
    };
    return [...avaliados].sort((a, b) =>
        pontuar(a) - pontuar(b) || a.w * a.h - b.w * b.h || b.w - a.w
    )[0];
}

// Arredondamento para o tamanho automático (legibilidade); não se aplica ao ajuste manual.
export const passoPar = (valor, minimo = 2, maximo = MAX_LINHAS_GRADE) =>
    Math.max(minimo, Math.min(maximo, Math.ceil(inteiro(valor, minimo) / 2) * 2));

/** Limita sem alterar a paridade: 3×5, 7×9 etc. são dimensões válidas. */
export const passoInteiro = (valor, minimo = 2, maximo = MAX_LINHAS_GRADE) =>
    Math.max(minimo, Math.min(maximo, inteiro(valor, minimo)));

/** Divide a largura útil em células menores, com número PAR de colunas.
 * A largura física de cada célula é sempre igual à sua altura. */
export function colunasDaGrade(largura) {
    const disponivel = Math.max(0, Number(largura) || 0);
    const n = Math.floor((disponivel + ESPACAMENTO_GRADE) / (LADO_ALVO_GRADE + ESPACAMENTO_GRADE));
    return Math.max(4, Math.min(MAX_COLUNAS_GRADE, Math.floor(n / 2) * 2));
}

export function encaixarCartoes(cartoes, colunas = 6, prioridade = null) {
    const limite = passoPar(Math.max(4, inteiro(colunas, 6)), 4, MAX_COLUNAS_GRADE);
    const vistos = new Set();
    const pecas = (Array.isArray(cartoes) ? cartoes : []).filter((peca) => {
        if (!peca || typeof peca.id !== 'string' || vistos.has(peca.id)) return false;
        vistos.add(peca.id);
        return true;
    }).map((peca) => ({
        ...peca,
        x: Math.max(0, inteiro(peca.x, 0)),
        y: Math.max(0, inteiro(peca.y, 0)),
        w: passoInteiro(peca.w, MIN_LADO_CARTAO, limite),
        h: passoInteiro(peca.h, MIN_LADO_CARTAO),
    }));
    const ocupadas = new Set();
    const livre = (x, y, w, h) => {
        if (x < 0 || y < 0 || x + w > limite) return false;
        for (let linha = y; linha < y + h; linha++) {
            for (let coluna = x; coluna < x + w; coluna++) {
                if (ocupadas.has(`${coluna}:${linha}`)) return false;
            }
        }
        return true;
    };
    const reservar = (peca, x, y) => {
        peca.x = x; peca.y = y;
        for (let linha = y; linha < y + peca.h; linha++) {
            for (let coluna = x; coluna < x + peca.w; coluna++) ocupadas.add(`${coluna}:${linha}`);
        }
    };
    const ordem = [...pecas].sort((a, b) => (a.id === prioridade ? -1 : b.id === prioridade ? 1 :
        a.posicaoManual === b.posicaoManual ? 0 : a.posicaoManual ? -1 : 1));
    for (const peca of ordem) {
        const preferido = Math.min(peca.x, limite - peca.w);
        if (livre(preferido, peca.y, peca.w, peca.h)) {
            reservar(peca, preferido, peca.y);
            continue;
        }
        // Busca por linha/coluna: aproveita o primeiro espaço disponível, como no Tetris.
        for (let y = 0, encontrado = false; !encontrado; y++) {
            for (let x = 0; x <= limite - peca.w; x++) {
                if (livre(x, y, peca.w, peca.h)) {
                    reservar(peca, x, y);
                    encontrado = true;
                    break;
                }
            }
        }
    }
    const porId = new Map(ordem.map((peca) => [peca.id, peca]));
    return pecas.map((peca) => porId.get(peca.id));
}
