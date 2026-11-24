/**
 * Railroad Mestre — versão de cache idempotente para GitHub Pages.
 * Ajusta URLs locais de CSS e importações ES nos próprios fontes; não usa bundler.
 * Alterar `cacheVersion` em package.json sempre que houver publicação.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const configuracao = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const versao = configuracao.cacheVersion;
if (!/^mesa-\d+$/.test(versao)) throw new Error('cacheVersion inválida em package.json.');
const raiz = fileURLToPath(new URL('../', import.meta.url));

function arquivos(pasta, extensao) {
    const saida = [];
    for (const entrada of readdirSync(join(raiz, pasta), { withFileTypes: true })) {
        const relativo = join(pasta, entrada.name);
        if (entrada.isDirectory()) saida.push(...arquivos(relativo, extensao));
        else if (entrada.name.endsWith(extensao)) saida.push(relativo);
    }
    return saida;
}

function atualizar(caminho, transformar) {
    const original = readFileSync(join(raiz, caminho), 'utf8');
    const novo = transformar(original);
    if (novo !== original) {
        writeFileSync(join(raiz, caminho), novo, 'utf8');
        console.log(`Versão de cache atualizada: ${caminho}`);
    }
}

const moduloLocal = /((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"]))([./][^'"\s]+\.js)(?:\?v=mesa-\d+)?\2/g;
for (const arquivo of arquivos('js', '.js')) {
    atualizar(arquivo, (fonte) => fonte.replace(moduloLocal,
        (_, prefixo, aspas, caminho) => `${prefixo}${caminho}?v=${versao}${aspas}`));
}
const importacaoCss = /(@import\s+url\(\s*['"]?)(\.[^)'"\s]+\.css)(?:\?v=mesa-\d+)?(['"]?\s*\))/g;
for (const arquivo of arquivos('css', '.css')) {
    atualizar(arquivo, (fonte) => fonte.replace(importacaoCss,
        (_, prefixo, caminho, fim) => `${prefixo}${caminho}?v=${versao}${fim}`));
}
const recursoHtml = /((?:href|src)=(['"]))([./\w-][^'"\s]+\.(?:css|js))(?:\?v=mesa-\d+)?\2/g;
atualizar('index.html', (html) => html.replace(recursoHtml,
    (_, prefixo, aspas, caminho) => `${prefixo}${caminho}?v=${versao}${aspas}`));
console.log(`Railroad Mestre — recursos locais preparados para ${versao}.`);
