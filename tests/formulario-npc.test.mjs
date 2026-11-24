import test from 'node:test';
import assert from 'node:assert/strict';
import { preencherFormulario, lerFormulario } from '../js/modules/formularioNpc.js';
import { normalizarNpc, TRACOS_NPC } from '../js/modules/npcs.js';
import { criarRepositorioNpcs } from '../js/services/npcsLocal.js';

test('editar uma ficha antiga conserva os campos históricos e lê apenas os marcadores do formulário', (t) => {
    const campos = new Map();
    const grupos = new Map();
    const formulario = {
        querySelectorAll(seletor) {
            const [, grupo] = seletor.match(/^\[data-grupo="([^"]+)"\]$/);
            if (!grupos.has(grupo)) {
                const total = grupo.startsWith('traco-') ? 4 : 3;
                grupos.set(grupo, Array.from({ length: total }, () => ({ checked: false })));
            }
            return grupos.get(grupo);
        },
    };
    const tabela = { rows: [], replaceChildren(...linhas) { this.rows = linhas; } };
    function porId(id) {
        if (id === 'form-npc') return formulario;
        if (id === 'npc-orig-lista-itens') return tabela;
        if (!campos.has(id)) campos.set(id, { value: '' });
        return campos.get(id);
    }
    globalThis.document = { getElementById: porId, querySelectorAll: () => assert.fail('Consulta fora do formulário de NPC') };
    t.after(() => { delete globalThis.document; });

    const origem = normalizarNpc({
        id: 'maquinista', nome: 'Maquinista', tracoPrincipal: 'Rédea e Sela',
        nomeJogador: 'Arquivo antigo', imagemJogador: 'data:image/png;base64,eA==',
        inventario: 'Anotação de inventário da primeira versão', condicoes: { ferimentos: 2 },
    });
    preencherFormulario(origem);
    assert.equal(porId('npc-orig-nome-personagem').value, 'Maquinista');
    assert.deepEqual(grupos.get('ferimentos').map((campo) => campo.checked), [true, true, false]);

    porId('npc-orig-nome-personagem').value = 'Maquinista Ana';
    porId('npc-orig-municao-primaria').value = '4';
    grupos.get('ferimentos')[1].checked = false;
    const grupoPrincipal = grupos.get(`traco-${TRACOS_NPC.indexOf(origem.tracoPrincipal) + 1}`);
    grupoPrincipal.forEach((campo) => { campo.checked = true; });
    const item = { local: 'montaria', nome: 'Cantil', quantidade: '2', tamanho: '1', descricao: 'Água' };
    tabela.rows = [{ querySelector: (seletor) => ({ value: item[seletor.match(/"([^"]+)"/)[1]] }) }];

    const memoria = new Map();
    const repo = criarRepositorioNpcs({
        getItem: (chave) => memoria.get(chave),
        setItem: (chave, valor) => memoria.set(chave, valor),
    });
    repo.salvar('mestre', 'campanha', [lerFormulario(origem)]);
    const [salva] = repo.carregar('mestre', 'campanha');
    assert.equal(origem.nome, 'Maquinista');
    assert.equal(salva.nome, 'Maquinista Ana');
    assert.equal(salva.armas.primaria.municao, 4);
    assert.equal(salva.condicoes.ferimentos, 1);
    assert.equal(salva.nivelPrincipal, 4);
    assert.deepEqual(salva.itens, [{ ...item, quantidade: 2, tamanho: 1 }]);
    for (const chave of ['id', 'tracoPrincipal', 'nomeJogador', 'imagemJogador', 'inventario']) {
        assert.equal(salva[chave], origem[chave]);
    }
});

test('uma entrada ou item danificado não oculta os NPCs válidos da mesma campanha', () => {
    const dados = [null, { id: 'um', nome: 'Iara', itens: [null, { nome: 'Lona' }], armas: { primaria: null } },
        { id: 'dois', nome: 'Dora' }];
    const repo = criarRepositorioNpcs({ getItem: () => JSON.stringify(dados) });
    const npcs = repo.carregar('mestre', 'campanha');
    assert.deepEqual(npcs.map((npc) => npc.nome), ['Iara', 'Dora']);
    assert.deepEqual(npcs[0].itens.map((item) => item.nome), ['Lona']);
    assert.equal(npcs[0].armas.primaria.municao, 0);
});
