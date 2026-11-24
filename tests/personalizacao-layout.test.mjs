import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (nome) => readFileSync(new URL(`../${nome}`, import.meta.url), 'utf8');
const css = ler('css/personalizacao.css');

test('as sete abas podem quebrar de linha em barras estreitas', () => {
    const html = ler('index.html');
    assert.equal((html.match(/data-pagina="/g) || []).length, 7);
    assert.ok(css.includes('#navegacao-mestre[hidden], body.modo-entrada #navegacao-mestre'));
    assert.match(css, /#navegacao-mestre\[hidden\][^{}]*\{[^}]*display: none !important/);
    assert.match(css, /#navegacao-mestre:not\(\[hidden\]\)\s*\{[^}]*display: flex[^}]*flex-wrap: wrap[^}]*overflow: visible/s);
    assert.match(css, /@media \(max-width: 700px\)[\s\S]*?--rr-nav-largura: 116px; --rr-nav-altura: 38px/);
});

test('os três estilos compartilham as dimensões da aba e os SVGs do kit mantêm o viewBox', () => {
    assert.match(css, /#navegacao-mestre \.aba-navegacao\.aba-cartucho[^{}]*\{[^}]*width:\s*var\(--rr-nav-largura\)[^}]*height:\s*var\(--rr-nav-altura\)/s);
    const kit = ler('css/tema/botoes.css');
    for (const nome of ['faca-bowie','cartucho-12','cartucho-45']) assert.ok(kit.includes(`.rr-botao--${nome}`));
    assert.match(css, /#navegacao-mestre \.aba-navegacao\.aba-cartucho::before\s*\{[^}]*border-image:\s*none[^}]*transform:\s*scaleX\(-1\)/s);
});

test('legenda e prévia da faca têm área própria para o texto', () => {
    assert.match(css, /\[data-rr-botoes="faca-bowie"\] #navegacao-mestre \.cartucho-texto\s*\{[^}]*left:\s*12%[^}]*width:\s*54%/);
    assert.match(css, /\.personalizacao-amostra--botao\.rr-botao--faca-bowie\s*\{[^}]*padding-right:\s*20%/s);
    assert.match(css, /\.personalizacao-amostra--botao\.rr-botao--faca-bowie::before/);
});

test('molduras preservam o espaço de conteúdo dos cartões', () => {
    assert.doesNotMatch(css, /padding-inline:\s*max\(18px,\s*1\.6vw\)\s*!important/);
    assert.doesNotMatch(css, /padding-block:\s*max\(15px,\s*1\.1rem\)\s*!important/);
    assert.match(css, /#painel \[data-rr-papel\]\.rr-tema-borda-ativa\s*\{[^}]*box-sizing:\s*border-box\s*!important/);
    const molduras = ler('css/tema/molduras.css');
    for (const nome of ['ornamental','ferro-rebitado','cantoneiras','chanfrada']) assert.ok(molduras.includes(`.rr-borda--${nome}`));
    assert.ok(!molduras.includes('.rr-borda--hachurada'));
});

test('desenho ocupa toda a aba e neutraliza a largura legada de 13px', () => {
    assert.match(css, /#navegacao-mestre \.aba-navegacao\.aba-cartucho::before\s*\{[^}]*width: 100%;[^}]*height: 100%;[^}]*border-radius: 0;/s);
});

test('desktop reserva o espaço central para as sete abas compactas', () => {
    assert.match(css, /@media \(min-width: 1100px\)[\s\S]*?order: 1;[\s\S]*?flex: 1 1 0;[\s\S]*?flex-wrap: nowrap;[\s\S]*?gap: 2px;/);
    assert.ok(css.includes('calc((100cqw - 12px) / 7)'));
});
