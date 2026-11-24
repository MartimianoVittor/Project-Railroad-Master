import { readFileSync } from 'node:fs';

export function codigoDaArea(entrada, pertence) {
    const visitados = new Set();
    const fontes = [];
    function visitar(url) {
        if (visitados.has(url.href)) return;
        visitados.add(url.href);
        const texto = readFileSync(url, 'utf8');
        fontes.push(texto);
        for (const [, relativo] of texto.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
            const destino = new URL(relativo, url);
            if (pertence(destino.pathname)) visitar(destino);
        }
    }
    visitar(new URL(`../../${entrada}`, import.meta.url));
    return fontes.join('\n');
}

export function codigoUtilitarios() {
    return codigoDaArea('js/controllers/utilitarios.js', (arquivo) =>
        arquivo.includes('/modules/utilitarios/') || arquivo.endsWith('/services/consultasLocal.js'));
}
