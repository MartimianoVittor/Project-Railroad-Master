import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
const paginas = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];

test('a barra mobile é separada da barra superior desktop e possui sete áreas', () => {
    const html = ler('index.html');
    assert.match(html, /<nav id="navegacao-mestre"[^>]*>/);
    assert.match(html, /<nav id="navegacao-mobile-mestre"[^>]*hidden>/);
    const mobile = html.match(/<nav id="navegacao-mobile-mestre"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(mobile);
    for (const pagina of paginas) assert.match(mobile, new RegExp(`data-pagina="${pagina}"`));
    assert.equal((mobile.match(/data-pagina="/g) ?? []).length, 7);
    assert.ok(html.indexOf('id="navegacao-mobile-mestre"') > html.indexOf('</header>'));
});

test('a barra inferior não ocupa espaço desktop e o rodapé só é reservado no mobile', () => {
    const css = ler('css/mobile-mestre.css');
    assert.match(css, /@media \(min-width: 901px\)\s*\{[\s\S]*?body #navegacao-mobile-mestre \{ display: none !important; \}/);
    assert.match(css, /@media \(min-width: 901px\)\s*\{[\s\S]*?main \{ padding-bottom: 0 !important; \}/);
    assert.match(css, /@media \(max-width: 900px\)\s*\{[\s\S]*?body \.barra-superior #navegacao-mestre \{ display: none !important; \}/);
    assert.match(css, /@media \(max-width: 900px\)\s*\{[\s\S]*?#navegacao-mobile-mestre:not\(\[hidden\]\) \{ display: flex !important; \}/);
    assert.match(css, /@media \(max-width: 900px\)[\s\S]*?padding-bottom: var\(--rr-mobile-rodape\)/);
});

test('login e logout controlam ambas as barras e a navegação sincroniza as abas', () => {
    const js = ler('js/app/sessao.js');
    assert.match(js, /porId\('navegacao-mestre'\)\.hidden = !usuario;/);
    assert.match(js, /porId\('navegacao-mobile-mestre'\)\.hidden = !usuario;/);
    assert.match(ler('js/modules/mobileMestre.js'), /getElementById\('navegacao-mobile-mestre'\)/);
    assert.match(ler('js/modules/navegacao.js'), /querySelectorAll\('\[data-pagina\]'\)/);
});
