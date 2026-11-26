import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPersonagensDisponiveis } from '../js/modules/personagensCampanha.js';

test('fichas aprovadas aparecem em Viagem e Combate com ID da ficha, não do envio', () => {
    const estado = {
        npcs: [{ id: 'npc-1', nome: 'Xerife' }],
        participantes: [{ jogador_id: 'j-1', jogador_nome: 'Ana', envio_id: 'env-1',
            personagem_nome: 'Jane', ficha_status: 'aprovada' }],
        envios: [{ envio_id: 'env-1', ficha_id: 'ficha-1', status: 'aprovada', titulo: 'Jane' }]
    };
    const lista = listarPersonagensDisponiveis(estado, new Map());
    assert.deepEqual(lista.map(item => item.id), ['npc:npc-1', 'jogador:ficha-1']);
    assert.equal(lista[1].nome, 'Jane');
    assert.equal(lista[1].responsavel, 'Ana');
});

test('não duplica fichas aprovadas e exclui pendentes', () => {
    const estado = {
        npcs: [], participantes: [{ envio_id: 'env-1', ficha_status: 'aprovada', personagem_nome: 'Jane' }],
        envios: [{ envio_id: 'env-1', ficha_id: 'ficha-1', status: 'aprovada' },
                 { envio_id: 'env-2', ficha_id: 'ficha-2', status: 'pendente' }]
    };
    assert.deepEqual(listarPersonagensDisponiveis(estado).map(item => item.ref), ['ficha-1']);
});

test('ficha aprovada diretamente na lista de envios permanece disponível', () => {
    assert.equal(listarPersonagensDisponiveis({
        npcs: [], participantes: [], envios: [{ ficha_id: 'f1', status: 'aprovada', titulo: 'Zoe' }]
    })[0].nome, 'Zoe');
});

test('RPC dedicada traz ficha_id sem exigir junção manual dos envios antigos', () => {
    const estado = { npcs: [], participantes: [], envios: [], personagensAprovados: [
        { ficha_id: 'ficha-RPC', jogador_nome: 'Joana', personagem_nome: 'Maya' }
    ] };
    assert.deepEqual(listarPersonagensDisponiveis(estado), [{
        id: 'jogador:ficha-RPC', ref: 'ficha-RPC', tipo: 'jogador',
        nome: 'Maya', responsavel: 'Joana', papel: ''
    }]);
});

test('migração dedicada não duplica personagens já conhecidos por envios', () => {
    const estado = { npcs: [], participantes: [],
        envios: [{ ficha_id: 'f1', status: 'aprovada', titulo: 'Maya' }],
        personagensAprovados: [{ ficha_id: 'f1', jogador_nome: 'Joana', personagem_nome: 'Maya' }],
    };
    assert.equal(listarPersonagensDisponiveis(estado).length, 1);
});
