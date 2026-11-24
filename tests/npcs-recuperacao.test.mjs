import test from 'node:test';
import assert from 'node:assert/strict';
import { criarControladorNpcs } from '../js/controllers/npcs.js';
import { criarNpc } from '../js/modules/npcs.js';

function interfaceFalsa(t) {
    const elementos = new Map();
    function elemento() {
        return {
            children: [], value: '', hidden: false, disabled: false, textContent: '',
            classList: { add() {}, remove() {}, toggle() {} },
            append(...filhos) { this.children.push(...filhos); },
            replaceChildren(...filhos) { this.children = [...filhos]; },
            querySelector() { return elemento(); }, querySelectorAll() { return []; },
            setAttribute() {}, addEventListener() {},
        };
    }
    function porId(id) {
        if (!elementos.has(id)) elementos.set(id, elemento());
        return elementos.get(id);
    }
    globalThis.document = { getElementById: porId, createElement: elemento };
    t.mock.method(globalThis, 'setTimeout', () => 0);
    t.after(() => { delete globalThis.document; });
    return porId;
}

function mesa(comLocal) {
    return {
        usuario: { id: 'mestre' }, campanhaId: 'campanha', versaoSessao: 1,
        modoLocal: false, npcs: [], npcsSincronizados: false,
        npcsRepo: {
            carregar: () => structuredClone(comLocal),
            salvar: (_u, _c, lista) => structuredClone(lista),
        },
    };
}

test('falha do Supabase mantém NPCs locais sem permitir gravações', async (t) => {
    const porId = interfaceFalsa(t);
    const npc = { ...criarNpc('completa'), nome: 'Testemunha', revisao: 4 };
    const estado = mesa([npc]);
    const controlador = criarControladorNpcs({ estado }, {
        listarRemotos: async () => { throw Error('Sem rede'); },
    });
    await controlador.carregarCampanha();
    assert.equal(estado.npcs.length, 1);
    assert.equal(estado.npcs[0].nome, 'Testemunha');
    assert.equal(estado.npcsSincronizados, false);
    assert.equal(porId('novo-npc').disabled, true);
    assert.equal(porId('editar-npc').disabled, true);
    assert.match(porId('contexto-npcs').textContent, /cópia local/i);
    assert.equal(porId('total-npcs').textContent, '1');
});

test('carregamento online bem-sucedido libera edição e guarda revisões de NPCs', async (t) => {
    const porId = interfaceFalsa(t);
    const npc = { ...criarNpc('completa'), nome: 'Guia', revisao: 6 };
    const estado = mesa([]);
    const controlador = criarControladorNpcs({ estado }, {
        listarRemotos: async () => [npc],
    });
    await controlador.carregarCampanha();
    assert.equal(estado.npcs.length, 1);
    assert.equal(estado.npcs[0].revisao, 6);
    assert.equal(estado.npcsSincronizados, true);
    assert.equal(porId('novo-npc').disabled, false);
    assert.equal(porId('editar-npc').disabled, false);
});
