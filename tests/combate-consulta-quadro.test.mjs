import test from 'node:test';
import assert from 'node:assert/strict';
import { criarControladorCombate } from '../js/controllers/combate.js';

class Elemento {
    constructor(tag = 'div') {
        this.tag = tag;
        this.children = [];
        this.textContent = '';
        this.className = '';
        this.attributes = {};
        this.dataset = {};
        this.style = { removeProperty() {} };
        this.listeners = {};
        this.value = '';
        const classe = this;
        this.classList = {
            add(...names) { classe.className = [...new Set([...classe.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
            remove(...names) { classe.className = classe.className.split(/\s+/).filter(n => n && !names.includes(n)).join(' '); },
            toggle(name, yes) { if (yes === false) this.remove(name); else if (yes === true) this.add(name); else if (classe.className.split(/\s+/).includes(name)) this.remove(name); else this.add(name); },
        };
    }
    append(...items) { this.children.push(...items.flatMap(item => item.tag === '#fragment' ? item.children : [item])); }
    replaceChildren(...items) { this.children = []; this.append(...items); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(event, callback) { this.listeners[event] = callback; }
    closest() { return this; }
    querySelectorAll() { return []; }
}
const sessao = new Map();
const storage = {
    getItem: key => sessao.get(key) ?? null,
    setItem: (key, value) => { sessao.set(key, value); },
    removeItem: key => { sessao.delete(key); },
};
globalThis.sessionStorage = storage;
globalThis.localStorage = storage;
globalThis.window = { localStorage: storage };

const fichaJogador = {
    titulo: 'Rosa do Deserto',
    dados: {
        nome: 'Ana',
        personagem: { 'nome-personagem': 'Rosa do Deserto', marcadores: {} },
        inventario: { itens: [{ nome: 'Cantil', quantidade: 2, tamanho: 1, local: 'jogador' }], rolagens: {} },
    },
};
function lutador(tipo) {
    return { id: `${tipo}:id-1`, tipo, ref: 'id-1', nome: tipo === 'npc' ? 'Capataz' : 'Rosa do Deserto',
        responsavel: tipo === 'npc' ? 'NPC' : 'Ana', iniciativa: 12, ordem: 0, ferimentos: 0,
        tracos: {}, armas: { primaria: { nome: '', municao: 0, bonus: {} }, secundaria: { nome: '', municao: 0, bonus: {} } },
        condicoes: [], preparada: '', vantagem: 0, desvantagem: 0 };
}
function ambiente(tipo) {
    sessao.clear();
    const elementos = new Map();
    const action = new Elemento();
    const get = id => {
        if (!elementos.has(id)) elementos.set(id, new Elemento());
        return elementos.get(id);
    };
    globalThis.document = {
        getElementById: get,
        createElement: tag => new Elemento(tag),
        createDocumentFragment: () => new Elemento('#fragment'),
    };
    get('combate-atual').closest = () => action;
    const combatente = lutador(tipo);
    const storageKey = `railroad-combate:v1:mestre:campanha`;
    storage.setItem(storageKey, JSON.stringify({ combatentes: [combatente], selecionado: null, atual: combatente.id, turno: 0 }));
    const navegacao = { atual: 'combate', chamadas: 0, abrir() { this.chamadas++; throw Error('Não deve navegar'); } };
    const estado = {
        usuario: { id: 'mestre' }, campanhaId: 'campanha', modoLocal: true, versaoSessao: 1,
        envios: [], cliente: null, navegacao,
        npcs: tipo === 'npc' ? [{ id: 'id-1', nome: 'Capataz', tracos: {}, armas: {}, itens: [], condicoes: {} }] : [],
        repositorio: { obterFicha: async (campanha, id) => {
            assert.equal(campanha, 'campanha'); assert.equal(id, 'id-1'); return fichaJogador;
        } },
    };
    const controller = criarControladorCombate({ estado });
    controller.iniciarEventos();
    controller.atualizar();
    const acao = get('combate-atual').children.find(child => child.className.includes('combate-ficha-em-acao'));
    assert.ok(acao, 'o cartão Em ação deve conter um botão acessível');
    return { estado, get, acao, controller, action };
}
function textoEmArvore(no) {
    return [no.textContent, ...no.children.map(textoEmArvore)].join(' ');
}
async function abrir(ambiente) {
    ambiente.acao.listeners.click();
    await new Promise(resolve => setImmediate(resolve));
    return ambiente.get('combate-detalhe');
}

test('Em ação: ficha do jogador ocupa o cartão de consulta do próprio Combate', async () => {
    const app = ambiente('jogador');
    const area = await abrir(app);
    assert.equal(app.estado.navegacao.atual, 'combate');
    assert.equal(app.estado.navegacao.chamadas, 0);
    assert.match(area.className, /combate-consulta-ficha-ativa/);
    assert.equal(area.children[1].children.length, 3);
    assert.deepEqual(area.children[1].children.map(e => e.tag), ['article','article','article']);
    assert.match(textoEmArvore(area), /Jogador.*Ana.*Personagem.*Rosa do Deserto.*Inventário.*Cantil/);
});

test('Em ação: NPC usa a mesma consulta embutida e não abre outra página', async () => {
    const app = ambiente('npc');
    const area = await abrir(app);
    assert.equal(app.estado.navegacao.chamadas, 0);
    assert.equal(area.children[1].children.length, 3);
    assert.match(textoEmArvore(area), /Capataz.*Inventário/);
});

test('Em ação: exibe erro no próprio cartão quando a ficha não pode ser consultada', async () => {
    const app = ambiente('jogador');
    app.estado.repositorio.obterFicha = async () => { throw Error('Sem acesso à ficha'); };
    const area = await abrir(app);
    assert.equal(app.estado.navegacao.chamadas, 0);
    assert.match(textoEmArvore(area), /Sem acesso à ficha/);
    assert.equal(area.attributes['aria-busy'], 'false');
});
