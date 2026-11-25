import { FUNDAMENTOS } from './regras/fundamentos.js?v=mesa-35';
import { COMBATE } from './regras/combate.js?v=mesa-35';
import { EXPEDICAO } from './regras/expedicao.js?v=mesa-35';
import { MESTRE } from './regras/mestre.js?v=mesa-35';

/** Railroad RPG, livro de regras edição 1.0, novembro/2026.
 * Resumos autorais para consulta rápida: consultar páginas indicadas para o procedimento completo.
 * Os valores e exceções provêm do PDF de referência fornecido pelo autor.
 */
export const CATEGORIAS_REGRAS = [
    'Testes e dados', 'Personagens', 'Combate', 'Condições e armadilhas',
    'Armas e alcance', 'Inventário', 'Viagens', 'Sobrevivência',
    'Fabricação e economia', 'Exploração e mestre', 'Apêndices'
];

export const MECANICAS = Object.freeze(
    [...FUNDAMENTOS, ...COMBATE, ...EXPEDICAO, ...MESTRE].map((regra) =>
        Object.freeze({ ...regra, itens: regra.itens ?? [] })),
);

export const MECANICAS_POR_ID = new Map(MECANICAS.map((regra) => [regra.id, regra]));

export const CONSULTAS_PADRAO = Object.freeze([
    {
        id: "essenciais", nome: "Regras essenciais",
        itens: ["teste", "dado-explosivo", "graus", "modificadores", "acoes", "ataque", "sobre-marcas"],
    },
    {
        id: "combate", nome: "Escudo de combate",
        itens: ["acoes", "iniciativa", "ataque", "cobertura", "ajuda-combate", "cond-movimento", "estado-critico", "armas-perfis"],
    },
    {
        id: "viagem", nome: "Estrada e provisões",
        itens: ["viagem-distancias", "viagem-ritmo", "viagem-busca", "viagem-cuidados", "sobre-necessidades", "invent-consumo"],
    },
    {
        id: "sobrevivencia", nome: "Sobrevivência e cuidados",
        itens: ["sobre-necessidades", "sobre-marcas", "sobre-resistencia", "sobre-recuperacao", "sobre-kit", "sobre-critico"],
    },
    {
        id: "mestre", nome: "Ferramentas do Mestre",
        itens: ["teste", "opostos", "mestre-desafios", "perseguicoes", "tabela-a", "tabela-b", "reputacao"],
    },
]);
