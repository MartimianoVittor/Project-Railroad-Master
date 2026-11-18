import test from 'node:test';
import assert from 'node:assert/strict';
import { criarControladorFichas } from '../js/controllers/fichas.js';

class No {
    constructor(tag = 'div') {
        this.tag = tag;
        this.children = [];
        this.textContent = '';
        this.className = '';
        this.attributes = {};
        this.dataset = {};
        this.listeners = {};
        this.value = '';
    }
    append(...itens) {
        this.children.push(...itens.flatMap((item) => item.tag === '#fragment' ? item.children : [item]));
    }
    replaceChildren(...itens) { this.children = []; this.append(...itens); }
    setAttribute(nome, valor) { this.attributes[nome] = valor; }
    addEventListener(nome, callback) { this.listeners[nome] = callback; }
}

function simularInterface() {
    const ids = new Map();
    const botoes = ['jogador', 'personagem', 'inventario'].map((parte) => {
        const botao = new No('button');
        botao.dataset.compararFicha = parte;
        return botao;
    });
    globalThis.document = {
        getElementById(id) {
            if (!ids.has(id)) ids.set(id, new No());
            return ids.get(id);
        },
        createElement: (tag) => new No(tag),
        createDocumentFragment: () => new No('#fragment'),
        querySelectorAll: (seletor) => seletor === '[data-comparar-ficha]' ? botoes : [],
    };
    return { ids, botoes };
}

const ficha = (id) => ({
    id, titulo: id, dados: {
        nome: `Jogador ${id}`,
        personagem: { 'nome-personagem': `Personagem ${id}`, marcadores: {} },
        inventario: { itens: [], rolagens: {} },
    },
});

const aguardarRender = () => new Promise((resolver) => setImmediate(resolver));

test('seleção exibe três partes; comparação exibe uma parte de cada personagem', async () => {
    const { ids, botoes } = simularInterface();
    const consultados = [];
    const estado = {
        campanhaId: 'campanha-1', versaoFicha: 0, versaoSessao: 0,
        envios: [
            { envio_id: 'e1', ficha_id: 'f1', titulo: 'Primeiro', status: 'aprovada' },
            { envio_id: 'e2', ficha_id: 'f2', titulo: 'Segundo', status: 'pendente' },
            { envio_id: 'e3', ficha_id: 'f3', titulo: 'Terceiro', status: 'recusada' },
        ],
        navegacao: { atual: 'fichas' },
        repositorio: {
            obterFicha: async (campanha, id) => {
                consultados.push([campanha, id]);
                return ficha(id);
            },
        },
    };
    const controlador = criarControladorFichas({ estado });
    controlador.iniciarEventos();

    assert.equal(ids.get('seletor-personagem').children.length, 3,
        'o seletor não deve incluir fichas recusadas');

    controlador.selecionarFicha('f1');
    await aguardarRender();
    assert.equal(ids.get('conteudo-fichas').children.length, 3);
    assert.match(ids.get('conteudo-fichas').className, /modo-completo/);
    assert.deepEqual(consultados, [['campanha-1', 'f1']]);

    controlador.compararParte('personagem');
    await aguardarRender();
    assert.equal(ids.get('conteudo-fichas').children.length, 2);
    assert.match(ids.get('conteudo-fichas').className, /modo-comparacao/);
    assert.equal(botoes[1].attributes['aria-pressed'], 'true');
    assert.equal(consultados.length, 3);
});

test('resultado de outra campanha não substitui a visualização atual', async () => {
    const { ids } = simularInterface();
    let resolverBusca;
    const estado = {
        campanhaId: 'antiga', versaoFicha: 0, versaoSessao: 0,
        envios: [{ envio_id: 'e1', ficha_id: 'f1', titulo: 'Antigo', status: 'aprovada' }],
        navegacao: { atual: 'fichas' },
        repositorio: { obterFicha: () => new Promise((resolver) => { resolverBusca = resolver; }) },
    };
    const controlador = criarControladorFichas({ estado });
    controlador.iniciarEventos();
    controlador.selecionarFicha('f1');
    assert.equal(typeof resolverBusca, 'function');

    estado.campanhaId = 'nova';
    estado.envios = [];
    controlador.listarEnvios();
    resolverBusca(ficha('f1'));
    await aguardarRender();

    assert.equal(ids.get('conteudo-fichas').children.length, 1);
    assert.match(ids.get('conteudo-fichas').children[0].textContent, /Nenhuma ficha compartilhada/);
});
