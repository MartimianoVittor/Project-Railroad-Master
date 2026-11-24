import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACOS } from '../js/modules/ficha/campos.js';
import { rolarTraco } from '../js/modules/rolagem.js';
import { criarCombatente } from '../js/modules/combate/combatentes.js';
import { sortearDadosNpc } from '../js/modules/npcs/gerador.js';
import { criarNpc } from '../js/modules/npcs.js';

test('combate lê os marcadores da ficha atual e os campos numéricos de fichas antigas', () => {
    const item = { id: 'jogador:1', ref: '1', nome: 'Ana', tipo: 'jogador' };
    const ficha = { dados: {
        personagem: { marcadores: { 'traco-1': [false, false, true, false], ferimentos: [true, false, true] }, 'traco-2': 2 },
        inventario: { rolagens: { 'arma-primaria': 'Carabina', 'municao-primaria': '6' } },
    } };
    const combate = criarCombatente(item, ficha, 0);
    assert.equal(combate.tracos[TRACOS[0]], 3);
    assert.equal(combate.tracos[TRACOS[1]], 2);
    assert.equal(combate.ferimentos, 2);
    combate.armas.primaria.municao--;
    assert.equal(ficha.dados.inventario.rolagens['municao-primaria'], '6');
});

test('rolagem usa o dado do nível e só explode quando ele atinge o máximo', () => {
    const resultados = [0.999, 0];
    assert.deepEqual(rolarTraco(2, () => resultados.shift()), { faces: 6, dados: [6, 1], soma: 7 });
    assert.deepEqual(rolarTraco(0, () => assert.fail()), { faces: 1, dados: [1], soma: 1 });
    assert.equal(rolarTraco(4, () => 0.999).dados.length, 100);
});

test('gerar NPC preserva o inventário e distribui 25 pontos no novo rascunho', () => {
    const anterior = criarNpc('completa');
    anterior.itens.push({ nome: 'Mapa', local: 'personagem', quantidade: 1, tamanho: 1 });
    const npc = sortearDadosNpc(anterior);
    assert.equal(npc.id, anterior.id);
    assert.equal(Object.values(npc.tracos).reduce((soma, valor) => soma + valor, 0), 25);
    assert.ok(Object.values(npc.tracos).every((nivel) => nivel >= 0 && nivel <= 4));
    assert.deepEqual(npc.itens, anterior.itens);
    assert.notEqual(npc.itens, anterior.itens);
    assert.equal(anterior.nome, '');
});
