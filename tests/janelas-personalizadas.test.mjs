import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
test('janelas estáticas e dinâmicas recebem o acabamento principal', () => {
    const js = ler('js/modules/personalizacaoMestre.js');
    assert.match(js, /querySelectorAll\('dialog'\)\) aplicarAcabamento\(janela, 'principal', atuais\)/);
    assert.match(js, /observador\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
    assert.match(js, /querySelectorAll\(SELETORES_JANELAS_INTERNOS\)\) aplicarAcabamento\(elemento, 'interno', atuais\)/);
});
test('todos os nove fundos e molduras incluem janelas e cartões internos', () => {
    for (const [arquivo, tipo, nomes] of [
        ['texturas','fundo',['pergaminho','tabua','couro','mapa-topografico','latao','terracota','ferrovia','jornal','aco-envelhecido']],
        ['molduras','borda',['latonada','cartaz','ornamental','ferro-rebitado','ferrovia','cantoneiras','costura','chanfrada','filete']]
    ]) {
        const css = ler(`css/tema/${arquivo}.css`);
        for (const nome of nomes) {
            assert.ok(css.includes(`dialog[data-rr-papel].rr-${tipo}--${nome}`));
            assert.ok(css.includes(`dialog [data-rr-papel].rr-${tipo}--${nome}`));
        }
    }
    assert.match(ler('index.html'), /janelas-personalizadas\.css\?v=mesa-\d+/);
});

test('seletor de temas não recebe molduras decorativas nas opções', () => {
    const js = ler('js/modules/personalizacaoMestre.js');
    const seletores = js.split('const SELETORES_JANELAS_INTERNOS = [')[1].split('].join')[0];
    assert.doesNotMatch(seletores, /personalizacao-(grupo|opcao)/);
    const css = ler('css/janelas-personalizadas.css');
    assert.match(css, /personalizacao-opcao input\s*\{\s*position: static/);
});
