import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
const paginas = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];
const dialogos = ['criar-sessao', 'gerenciar-sessoes', 'personalizacao'];
const arquivos = [
    'index.html',
    ...paginas.map((pagina) => `views/pages/${pagina}.html`),
    ...dialogos.map((dialogo) => `views/dialogs/${dialogo}.html`),
];

test('index contém apenas estrutura e as duas navegações, sem duplicar páginas', () => {
    const html = ler('index.html');
    assert.ok(html.length < 10000);
    assert.match(html, /id="marcador-paginas"/);
    assert.match(html, /id="marcador-dialogos"/);
    assert.doesNotMatch(html, /id="pagina-diario"|id="pagina-campanhas"/);
    for (const pagina of paginas) {
        assert.match(ler(`views/pages/${pagina}.html`), new RegExp(`id="pagina-${pagina}"`));
    }
});

test('os IDs de toda a interface são únicos', () => {
    const ids = new Map();
    for (const arquivo of arquivos) {
        for (const [, id] of ler(arquivo).matchAll(/\bid="([^"]+)"/g)) {
            assert.ok(!ids.has(id), `ID duplicado: ${id} (${ids.get(id)} e ${arquivo})`);
            ids.set(id, arquivo);
        }
    }
});

test('o carregador usa caminhos relativos e verifica erros HTTP', () => {
    const js = ler('js/core/carregarInterface.js');
    assert.match(js, /new URL\(caminho, document\.baseURI\)/);
    assert.match(js, /if \(!resposta\.ok\)/);
    assert.match(js, /Promise\.all/);
    assert.match(ler('js/mesa.js'), /await carregarInterface\(\)/);
});

test('JS e CSS divididos por responsabilidade sem arquivos monolíticos', () => {
    assert.ok(ler('js/mesa.js').length < 11000);
    assert.ok(ler('css/mesa.css').length < 1000);
    for (const arquivo of [
        'js/controllers/campanhas.js', 'js/controllers/diario.js', 'js/controllers/fichas.js',
        'css/campanhas.css', 'css/diario.css', 'css/fichas.css', 'css/ferramentas.css',
        'css/sessoes.css', 'css/layout.css', 'css/responsivo.css',
    ]) assert.ok(ler(arquivo).length > 100, `Arquivo ausente/vazio: ${arquivo}`);
    assert.doesNotMatch(ler('js/mesa.js'), /function renderizarGerenciador\(/);
});
