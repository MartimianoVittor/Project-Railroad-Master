/**
 * Railroad Mestre — preparação idempotente dos recursos locais para publicação.
 * Sem compilação: as URLs são padronizadas em seus arquivos de origem.
 * Execute antes de publicar e registre o resultado no Git.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    versionarImportacoesJs,
    versionarImportacoesCss,
    versionarRecursosHtml,
} from './lib/versionamento.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const configuracao = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
const versao = configuracao.cacheVersion;
if (!/^mesa-\d+$/.test(versao)) throw new Error('cacheVersion inválida em package.json.');

function listarArquivos(pasta, extensao) {
    const encontrados = [];
    for (const item of readdirSync(join(raiz, pasta), { withFileTypes: true })) {
        const relativo = join(pasta, item.name);
        if (item.isDirectory()) encontrados.push(...listarArquivos(relativo, extensao));
        else if (item.name.endsWith(extensao)) encontrados.push(relativo);
    }
    return encontrados;
}

function atualizar(caminho, transformar) {
    const original = readFileSync(join(raiz, caminho), 'utf8');
    const atualizado = transformar(original, versao);
    if (atualizado === original) return false;
    writeFileSync(join(raiz, caminho), atualizado, 'utf8');
    console.log(`Versão de cache normalizada: ${caminho}`);
    return true;
}

let alterados = 0;
for (const arquivo of listarArquivos('js', '.js')) alterados += Number(atualizar(arquivo, versionarImportacoesJs));
for (const arquivo of listarArquivos('css', '.css')) alterados += Number(atualizar(arquivo, versionarImportacoesCss));
alterados += Number(atualizar('index.html', versionarRecursosHtml));
console.log(`Railroad Mestre — ${versao}: ${alterados} arquivo(s) normalizado(s).`);
