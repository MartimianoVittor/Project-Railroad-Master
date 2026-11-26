import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iniciarMobileMestre } from '../js/modules/mobileMestre.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('layout mobile cobre as sete páginas, preservando consultas e abas', () => {
    const css = ler('css/mobile-mestre.css');
    for (const area of ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios']) {
        assert.match(css, new RegExp(`#pagina-${area}`), `Área não encontrada: ${area}`);
    }
    assert.match(css, /#navegacao-mobile-mestre:not\(\[hidden\]\)/);
    assert.match(css, /overflow-x: auto/);
    const diario = ler('views/pages/diario.html');
    assert.match(diario, /quadro-viewport-mobile/);
    assert.match(diario, /id="diario-anotacoes"/);
});

test('navegação mobile recentraliza a aba ativa sem depender de canvas', () => {
    const original = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
    const ouvintes = {};
    const botoes = [
        { dataset: { quadroMobileDeslocar: '-1' }, addEventListener: (tipo, fn) => ouvintes.esquerda = fn },
        { dataset: { quadroMobileDeslocar: '1' }, addEventListener: (tipo, fn) => ouvintes.direita = fn },
    ];
    const aba = { offsetLeft: 590, offsetWidth: 110 };
    const navegacao = {
        hidden: false, clientWidth: 360, scrollLeft: 0,
        addEventListener(tipo, fn) { ouvintes.navegacao = fn; },
        querySelector() { return aba; },
    };
    const quadro = { clientWidth: 300, scrollBy({ left }) { this.ultimoDeslocamento = left; } };
    globalThis.document = {
        getElementById: () => navegacao,
        querySelector: () => quadro,
        querySelectorAll: () => botoes,
    };
    globalThis.window = { matchMedia: () => ({ matches: true, addEventListener: () => {} }) };
    globalThis.requestAnimationFrame = (cb) => cb();
    try {
        iniciarMobileMestre();
        assert.equal(navegacao.scrollLeft, 465);
        // As setas do quadro permanecem funcionais no celular.
        assert.equal(typeof ouvintes.esquerda, 'function');
        assert.equal(typeof ouvintes.direita, 'function');
        ouvintes.direita();
        assert.equal(quadro.ultimoDeslocamento, 210);
        ouvintes.esquerda();
        assert.equal(quadro.ultimoDeslocamento, -210);
        assert.equal(typeof ouvintes.navegacao, 'function');
    } finally {
        for (const [chave, valor] of Object.entries(original)) {
            if (valor === undefined) delete globalThis[chave];
            else globalThis[chave] = valor;
        }
    }
});
