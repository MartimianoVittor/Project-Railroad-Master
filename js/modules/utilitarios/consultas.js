import { MECANICAS_POR_ID } from '../catalogoRegras.js?v=mesa-35';
import { passoInteiro, MIN_LADO_CARTAO, MAX_COLUNAS_GRADE } from '../gradeConsultas.js?v=mesa-35';

export const MAX_CARTOES = 100;

export function copiarCartoes(cartoes) {
    if (!Array.isArray(cartoes)) return [];
    const vistos = new Set();
    return cartoes.slice(0, MAX_CARTOES).filter((p) => {
        if (!p || !MECANICAS_POR_ID.has(p.id) || vistos.has(p.id)) return false;
        vistos.add(p.id);
        return true;
    }).map((p) => ({
        id: p.id,
        x: Math.max(0, parseInt(p.x, 10) || 0),
        y: Math.max(0, parseInt(p.y, 10) || 0),
        w: passoInteiro(parseInt(p.w, 10) || MIN_LADO_CARTAO, MIN_LADO_CARTAO, MAX_COLUNAS_GRADE),
        h: passoInteiro(parseInt(p.h, 10) || MIN_LADO_CARTAO, MIN_LADO_CARTAO),
        manual: p.manual === true,
        // Versões antigas usavam "manual" também para corrigir altura automaticamente.
        // Somente ajustes feitos explicitamente a partir desta revisão ficam travados.
        ajusteManual: p.ajusteManual === true,
        posicaoManual: p.posicaoManual === true,
    }));
}
export function paraCartoes(ids) {
    return copiarCartoes(ids.map((id) => ({ id, x: 0, y: 0, w: MIN_LADO_CARTAO, h: MIN_LADO_CARTAO, manual: false, posicaoManual:false })));
}
export function nomeSeguro(nome) {
    return String(nome || '').trim().slice(0, 70);
}
export function idNovo() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `u:${crypto.randomUUID()}`;
    return `u:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
}

