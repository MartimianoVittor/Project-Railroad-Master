import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = nome => readFileSync(new URL(`../${nome}`, import.meta.url), 'utf8');

test('aviso de feedback permanece fixo apesar das bordas personalizadas', () => {
    const css = ler('css/avisos-flutuantes.css');
    assert.match(css, /#aviso\.aviso\s*\{\s*position:\s*fixed\s*!important/);
    assert.match(css, /inset:\s*auto\s+16px\s+16px\s+auto\s*!important/);
    assert.match(css, /overflow-wrap:\s*anywhere/);
});

test('o painel não reserva rodapé desktop e o estilo novo carrega após os demais', () => {
    const css = ler('css/layout.css');
    assert.match(css, /\.painel\s*\{[^}]*padding-bottom:\s*0;/);
    const html = ler('index.html');
    assert.ok(html.indexOf('css/desktop-viewport.css') < html.indexOf('css/avisos-flutuantes.css'));
    assert.match(html, /css\/avisos-flutuantes\.css\?v=mesa-39/);
});

test('avisos mobile respeitam espaço da navegação inferior', () => {
    assert.match(ler('css/avisos-flutuantes.css'), /@media\s*\(max-width:\s*900px\)[\s\S]*?--rr-mobile-rodape/);
});
