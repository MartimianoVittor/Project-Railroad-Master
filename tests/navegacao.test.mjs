import test from 'node:test';
import assert from 'node:assert/strict';
import { criarNavegacao } from '../js/modules/navegacao.js';

const paginas = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];

function criarElemento(dataset) {
    const atributos = new Map();
    const classes = new Set();
    const eventos = new Map();
    return {
        dataset, hidden: false,
        classList: {
            toggle: (classe, ativo) => ativo ? classes.add(classe) : classes.delete(classe),
            contains: (classe) => classes.has(classe),
        },
        setAttribute: (chave, valor) => atributos.set(chave, valor),
        removeAttribute: (chave) => atributos.delete(chave),
        getAttribute: (chave) => atributos.get(chave),
        addEventListener: (tipo, callback) => eventos.set(tipo, callback),
        clicar: () => eventos.get('click')(),
    };
}

test('a barra superior alterna exatamente uma seção por vez', () => {
    const botoes = paginas.map((pagina) => criarElemento({ pagina }));
    const paineis = paginas.map((paginaContainer) => criarElemento({ paginaContainer }));
    const visitadas = [];
    globalThis.document = {
        querySelectorAll: (seletor) => seletor === '[data-pagina]' ? botoes : paineis,
    };
    const navegacao = criarNavegacao({ aoNavegar: (pagina) => visitadas.push(pagina) });

    assert.equal(navegacao.atual, 'campanhas');
    botoes[4].clicar();
    assert.equal(navegacao.atual, 'combate');
    assert.equal(botoes[4].getAttribute('aria-current'), 'page');
    assert.equal(paineis.filter((painel) => !painel.hidden).length, 1);
    assert.equal(paineis[4].hidden, false);
    assert.equal(paineis[0].hidden, true);
    assert.deepEqual(visitadas, ['campanhas', 'combate']);
    assert.throws(() => navegacao.abrir('inexistente'), /Área inexistente/);
});

test('navegação pode ser cancelada quando há edição de NPC não salva', () => {
    const botoes = paginas.map((pagina) => criarElemento({ pagina }));
    const paineis = paginas.map((paginaContainer) => criarElemento({ paginaContainer }));
    globalThis.document = {
        querySelectorAll: (seletor) => seletor === '[data-pagina]' ? botoes : paineis,
    };
    const navegacao = criarNavegacao({
        antesDeNavegar: (_pagina, anterior) => anterior !== 'npcs',
    });
    navegacao.abrir('npcs');
    navegacao.abrir('diario');
    assert.equal(navegacao.atual, 'npcs');
    assert.equal(paineis[3].hidden, false);
});
