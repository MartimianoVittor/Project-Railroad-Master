/**
 * Versionamento das referências locais usadas pelo navegador.
 * As funções são puras, idempotentes e preservam referências externas.
 * Regras deliberadamente limitadas a arquivos .js/.css: imagens não usam cacheVersion.
 */
export function versionarImportacoesJs(fonte, versao) {
    const importacao = /(\b(?:from\s*|import\s*\(\s*|import\s+))(['"])([./][^'"\s?#]+\.js)(?:\?v=[^'"\s#]+)?\2/g;
    return fonte.replace(importacao, (_, prefixo, aspas, caminho) =>
        `${prefixo}${aspas}${caminho}?v=${versao}${aspas}`);
}

export function versionarImportacoesCss(fonte, versao) {
    const importacao = /(@import\s+url\(\s*['"]?)(\.[^)'"\s?#]+\.css)(?:\?v=[^)'"\s#]+)?(['"]?\s*\))/g;
    return fonte.replace(importacao, (_, inicio, caminho, fim) =>
        `${inicio}${caminho}?v=${versao}${fim}`);
}

export function versionarRecursosHtml(fonte, versao) {
    const recurso = /(\b(?:href|src)\s*=\s*)(['"])([^'"\s?#]+\.(?:css|js))(?:\?v=[^'"\s#]+)?\2/g;
    return fonte.replace(recurso, (original, atributo, aspas, caminho) => {
        // URLs externas nunca devem sofrer alterações, mesmo terminando em .js/.css.
        if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(caminho)) return original;
        return `${atributo}${aspas}${caminho}?v=${versao}${aspas}`;
    });
}
