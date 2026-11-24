import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarInterface } from '../js/core/carregarInterface.js';

function simularDocumento() {
    const insercoes = new Map();
    const documento = {
        baseURI: 'https://exemplo.github.io/railroad-mestre/',
        getElementById(id) {
            return {
                replaceWith(fragmento) { insercoes.set(id, fragmento.itens); },
            };
        },
        createDocumentFragment() {
            return {
                itens: [],
                append(conteudo) { this.itens.push(conteudo); },
            };
        },
        createElement(tag) {
            assert.equal(tag, 'template');
            return {
                set innerHTML(html) { this.content = html; },
            };
        },
    };
    return { documento, insercoes };
}

test('carrega sete abas e três diálogos usando caminhos relativos ao GitHub Pages', async () => {
    const { documento, insercoes } = simularDocumento();
    const urls = [];
    globalThis.document = documento;
    globalThis.fetch = async (url) => {
        urls.push(url.href);
        return { ok: true, text: async () => `<section>${url.pathname}</section>` };
    };

    await carregarInterface();

    assert.equal(urls.length, 10);
    assert.ok(urls.every((url) => url.startsWith(documento.baseURI)));
    assert.equal(insercoes.get('marcador-paginas').length, 7);
    assert.equal(insercoes.get('marcador-dialogos').length, 3);
    assert.match(insercoes.get('marcador-paginas')[1], /diario\.html/);
});

test('não monta páginas incompletas quando um fragmento falha', async () => {
    const { documento, insercoes } = simularDocumento();
    globalThis.document = documento;
    globalThis.fetch = async (url) => ({
        ok: !url.href.endsWith('/diario.html'),
        status: 404,
        text: async () => '<section>OK</section>',
    });

    await assert.rejects(carregarInterface(), /views\/pages\/diario\.html \(HTTP 404\)/);
    assert.equal(insercoes.size, 0);
});
