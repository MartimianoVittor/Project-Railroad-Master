/** A posição de cada traço é usada nos marcadores das fichas já salvas. */
export const TRACOS = Object.freeze([
    'Sangue Quente', 'Mira Afiada', 'Guerreiro Ancestral', 'Amigo Kaboom',
    'Orelha Em Pé', 'Passos Na Sombra', 'Poeira e Ossos', 'Rédea e Sela',
    'Língua de Trapo', 'Agourento e Carrancudo', 'Cachola Cheia', 'Grande Maioral',
]);

export const CONDICOES = Object.freeze([
    ['ferimentos', 'Ferimentos'], ['sede', 'Sede'],
    ['fome', 'Fome'], ['cansaco', 'Cansaço'],
]);

export const ARMAS = Object.freeze([
    ['primaria', 'Primária'], ['secundaria', 'Secundária'],
]);

export const DISTANCIAS = Object.freeze([
    ['corpo', 'Corpo a corpo'], ['curta', 'Curta'],
    ['media', 'Média'], ['longa', 'Longa'],
]);

export function nivelTraco(marcadores) {
    if (!Array.isArray(marcadores)) return 0;
    return Math.max(0, Math.min(4, marcadores.lastIndexOf(true) + 1));
}
