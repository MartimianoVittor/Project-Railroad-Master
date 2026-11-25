import { imagemSegura } from '../../services/imagensStorage.js?v=mesa-39';
import { ARMAS, DISTANCIAS, TRACOS, nivelTraco } from '../ficha/campos.js?v=mesa-39';

export const RETRATO_PADRAO = 'assets/imgs/imagemPersonagemPlaceholder.webp';

export function inteiro(valor, minimo = 0, maximo = 9999) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, Math.trunc(numero))) : minimo;
}

export function imagemValida(valor) {
    if (typeof valor !== 'string' || valor === RETRATO_PADRAO) return false;
    return imagemSegura(valor);
}

export function imagemDaFicha(ficha) {
    const personagem = ficha?.dados?.personagem ?? {};
    return [personagem.foto, personagem['imagem-personagem']].find(imagemValida) || '';
}

function valorDoMarcador(personagem, chave, maximo) {
    const marcas = personagem.marcadores?.[chave];
    const valor = Array.isArray(marcas) ? marcas.filter(Boolean).length : personagem[chave];
    return inteiro(valor, 0, maximo);
}

function armasDaFicha(rolagens) {
    const armas = {};
    for (const [chave] of ARMAS) {
        const bonus = {};
        for (const [distancia] of DISTANCIAS) {
            bonus[distancia] = Number(rolagens[`bonus-${chave}-${distancia}`]) || 0;
        }
        armas[chave] = {
            nome: rolagens[`arma-${chave}`] || '',
            municao: inteiro(rolagens[`municao-${chave}`]),
            bonus,
        };
    }
    return armas;
}

function tracosDaFicha(personagem) {
    return Object.fromEntries(TRACOS.map((traco, indice) => {
        const chave = `traco-${indice + 1}`;
        const marcas = personagem.marcadores?.[chave];
        const nivel = Array.isArray(marcas) ? nivelTraco(marcas) : inteiro(personagem[chave], 0, 4);
        return [traco, nivel];
    }));
}

// Um combatente é uma cópia operacional. A consulta da ficha original continua independente.
export function criarCombatente(item, origem, ordem) {
    const npc = item.tipo === 'npc';
    const personagem = origem.dados?.personagem ?? {};
    return {
        id: item.id, ref: item.ref, tipo: item.tipo, nome: item.nome,
        responsavel: item.responsavel, papel: item.papel,
        imagem: npc ? origem.imagem : imagemDaFicha(origem),
        ferimentos: npc ? inteiro(origem.condicoes?.ferimentos) : valorDoMarcador(personagem, 'ferimentos', 3),
        armas: npc ? structuredClone(origem.armas || {}) : armasDaFicha(origem.dados?.inventario?.rolagens ?? {}),
        tracos: npc ? structuredClone(origem.tracos || {}) : tracosDaFicha(personagem),
        iniciativa: 0, ordem, preparada: '', condicoes: [], vantagem: 0, desvantagem: 0,
    };
}

export function ordemDeIniciativa(a, b) {
    return b.iniciativa - a.iniciativa || a.ordem - b.ordem;
}
