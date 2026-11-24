import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const ler = (caminho) => readFileSync(join(raiz, caminho), 'utf8');
const versao = JSON.parse(ler('package.json')).cacheVersion;

function listar(diretorio, extensao) {
    const encontrados = [];
    for (const item of readdirSync(join(raiz, diretorio), { withFileTypes: true })) {
        const caminho = join(diretorio, item.name);
        if (item.isDirectory()) encontrados.push(...listar(caminho, extensao));
        else if (item.name.endsWith(extensao)) encontrados.push(caminho);
    }
    return encontrados;
}

test('todas as folhas CSS e o módulo principal usam a mesma versão de cache', () => {
    const html = ler('index.html');
    const referencias = [...html.matchAll(/(?:href|src)="(\S+\.(?:css|js)\?v=[^"\s]+)"/g)]
        .map((m) => m[1]);
    assert.ok(referencias.length >= 20);
    for (const referencia of referencias) {
        assert.ok(referencia.endsWith(`?v=${versao}`), `Versão divergente: ${referencia}`);
        assert.ok(existsSync(join(raiz, referencia.split('?')[0])), `Arquivo ausente: ${referencia}`);
    }
});

test('importações ES relativas resolvem arquivos existentes com a versão única', () => {
    for (const arquivo of listar('js', '.js')) {
        const fonte = ler(arquivo);
        for (const correspondencia of fonte.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([./][^'"\s]+\.js(?:\?v=[^'"\s]+)?)\1/g)) {
            const referencia = correspondencia[2];
            assert.ok(referencia.endsWith(`?v=${versao}`), `${arquivo}: ${referencia}`);
            const nome = referencia.split('?')[0];
            assert.ok(existsSync(resolve(raiz, dirname(arquivo), nome)), `${arquivo}: ${nome}`);
        }
    }
});

test('imports de CSS locais são resolvidos e versionados', () => {
    for (const arquivo of listar('css', '.css')) {
        for (const m of ler(arquivo).matchAll(/@import\s+url\(['"]?(\.[^)'"]+\.css(?:\?v=[^)'"\s]+)?)/g)) {
            const referencia = m[1];
            assert.ok(referencia.endsWith(`?v=${versao}`), `${arquivo}: ${referencia}`);
            assert.ok(existsSync(resolve(raiz, dirname(arquivo), referencia.split('?')[0])));
        }
    }
});

test('retratos padrão em WebP existem e são menores que os PNGs originais', () => {
    for (const base of ['imagemJogadorPlaceholder', 'imagemPersonagemPlaceholder']) {
        const png = join(raiz, 'assets', 'imgs', `${base}.png`);
        const webp = join(raiz, 'assets', 'imgs', `${base}.webp`);
        assert.ok(existsSync(png) && existsSync(webp));
        assert.ok(statSync(webp).size < statSync(png).size / 4);
    }
});
