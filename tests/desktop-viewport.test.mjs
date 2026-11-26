import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = nome => readFileSync(new URL(`../${nome}`, import.meta.url), 'utf8');

test('o layout dos cartões ocupa a viewport em qualquer largura desktop', () => {
    const html = ler('index.html');
    assert.match(html, /css\/viewport-colunas\.css\?v=mesa-44/);
    assert.doesNotMatch(html, /href="css\/(?:rolagem-colunas|encaixe-desktop)\.css/);
    assert.ok(html.indexOf('css/mobile-mestre.css') < html.indexOf('css/viewport-colunas.css'));
});

test('as regras antigas de altura natural não entram em conflito com o desktop', () => {
    assert.doesNotMatch(ler('css/tela-desktop.css'), /altura natural|\.painel\s*\{\s*display:\s*block;\s*height:\s*auto/);
    assert.doesNotMatch(ler('css/responsivo.css'), /Altura fluida: evita cortes verticais/);
    const css = ler('css/viewport-colunas.css');
    assert.match(css, /@media \(min-width: 901px\)/);
    assert.match(css, /#painel > \.pagina-mestre:not\(\[hidden\]\)/);
    assert.match(css, /\.grade-gerenciamento, \.grade-diario, \.grade-npcs/);
    assert.match(css, /grid-template-rows: minmax\(0, 1fr\)/);
});

test('a navegação mobile mantém a reserva no rodapé apenas até 900px', () => {
    const css = ler('css/mobile-mestre.css');
    assert.match(css, /@media \(max-width: 900px\)[\s\S]*?padding-bottom:\s*var\(--rr-mobile-rodape\)/);
    assert.doesNotMatch(ler('css/viewport-colunas.css'), /--rr-mobile-rodape/);
});

test('desktops estreitos preservam rolagem dos cartões empilhados', () => {
    const css = ler('css/viewport-colunas.css');
    assert.match(css, /@media \(min-width: 901px\) and \(max-width: 1060px\)/);
    assert.match(css, /grid-template-rows: repeat\(2, 100%\)/);
    assert.match(css, /#painel \.pagina-mestre > :is\(\.grade-gerenciamento,\.grade-npcs,\.grade-ferramentas\):not\(\[hidden\]\)/);
    assert.match(css, /overflow: visible/);
    assert.match(css, /#painel #pagina-diario > \.grade-diario:not\(\[hidden\]\)/);
    assert.match(css, /overflow-y: auto/);
});
