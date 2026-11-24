import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mensagemLista } from '../js/core/dom.js';
import { normalizarPreferencias } from '../js/modules/personalizacaoMestre.js';

const ler = arquivo => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

test('todas as áreas de dados têm um estado vazio padronizado', () => {
    const alvos = [
        ['views/pages/campanhas.html', 'id="sem-campanha" class="estado-vazio rr-estado-vazio"'],
        ['views/pages/diario.html', 'id="diario-vazio" class="cartao-campanha diario-vazio"'],
        ['views/pages/fichas.html', 'class="estado-consulta-fichas rr-estado-vazio"'],
        ['views/pages/npcs.html', 'class="estado-vazio npc-vazio rr-estado-vazio"'],
        ['views/pages/combate.html', 'class="rr-estado-vazio"'],
        ['views/pages/viagem.html', 'id="vg-detalhe"><p class="rr-estado-vazio"'],
        ['js/controllers/utilitarios.js', "'util-vazio rr-estado-vazio'"],
    ];
    for (const [arquivo, trecho] of alvos) {
        assert.ok(ler(arquivo).includes(trecho), `Sem vazio padronizado: ${arquivo}`);
    }
});

test('listas e cartões dinâmicos também utilizam a mesma classe', () => {
    for (const arquivo of [
        'js/controllers/combate.js', 'js/controllers/campanhas.js',
        'js/modules/combate/iniciativa.js', 'js/modules/viagem/painel.js',
        'js/modules/viagem/viajante.js', 'js/modules/viagem/seletorViajante.js',
        'js/controllers/fichas.js', 'js/modules/visualizarFicha.js',
    ]) {
        assert.match(ler(arquivo), /rr-estado-vazio/, `Classe não utilizada: ${arquivo}`);
    }
    const anterior = globalThis.document;
    try {
        globalThis.document = { createElement: tag => ({tagName: tag, className:'', textContent:''}) };
        const lista = { filhos: [], append(elemento) { this.filhos.push(elemento); } };
        mensagemLista(lista, 'Lista sem registros.');
        assert.equal(lista.filhos.length, 1);
        assert.equal(lista.filhos[0].tagName, 'li');
        assert.match(lista.filhos[0].className, /rr-estado-vazio/);
        assert.equal(lista.filhos[0].textContent, 'Lista sem registros.');
    } finally {
        if (anterior === undefined) delete globalThis.document;
        else globalThis.document = anterior;
    }
});

test('o vazio utiliza papel interno ou principal segundo a categoria do cartão', () => {
    const modulo = ler('js/modules/personalizacaoMestre.js');
    assert.match(modulo, /'#pagina-diario #diario-vazio'/);
    assert.match(modulo, /'#painel \.rr-estado-vazio'/);
    assert.match(modulo, /aplicarAcabamento\(elemento, 'principal', atuais\)/);
    assert.match(modulo, /aplicarAcabamento\(elemento, 'interno', atuais\)/);
    assert.equal(normalizarPreferencias({ fundoPrincipal: 'couro', fundoInterno: 'jornal' }).fundoInterno, 'jornal');
});

test('moldura pontilhada prevalece sobre as bordas do Kit Western sem desativar texturas', () => {
    const css = ler('css/estados-vazios.css');
    assert.match(css, /#painel \[data-rr-papel\]\.rr-estado-vazio/);
    assert.match(css, /border-style:\s*dashed !important/);
    assert.match(css, /border-color:\s*var\(--rr-leitura-borda/);
    assert.match(css, /color:\s*var\(--rr-leitura-texto/);
    assert.match(css, /::after,/);
    assert.doesNotMatch(css, /background-image:\s*none/);
    const pagina = ler('index.html');
    assert.match(pagina, /css\/estados-vazios\.css\?v=mesa-\d+/);
    assert.ok(pagina.indexOf('css/estados-vazios.css') > pagina.indexOf('css/personalizacao.css'));
});

 test('estados vazios de consulta ocupam toda a grade e Sessões preserva o cartão externo', () => {
    const css = ler('css/estados-vazios.css');
    assert.match(css, /#vg-detalhe:has\(> \.rr-estado-vazio:only-child\)/);
    assert.match(css, /max-width: none/);
    assert.doesNotMatch(css, /490px/);
    assert.match(ler('views/pages/diario.html'), /class="cartao-campanha diario-vazio">\s*<div class="rr-estado-vazio/);
 });
