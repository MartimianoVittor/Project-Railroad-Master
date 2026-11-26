import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarParticipantesDesvinculados, filtrarReferenciaRemovida } from '../js/modules/participantesMesa.js';
import { listarPersonagensDisponiveis } from '../js/modules/personagensCampanha.js';
import { atualizarCatalogoPersonagens } from '../js/services/catalogoPersonagens.js';

const participantes = [
    { id: 'npc:n1', ref: 'n1', tipo: 'npc', nome: 'Capataz', ferimentos: 1 },
    { id: 'npc:n2', ref: 'n2', tipo: 'npc', nome: 'Capataz', ferimentos: 2 },
    { id: 'jogador:f1', ref: 'f1', tipo: 'jogador', nome: 'Rosa' },
    { id: 'jogador:f2', ref: 'f2', tipo: 'jogador', nome: 'Rosa' },
];

test('exclusão confirmada remove só a referência correta, mesmo com nomes repetidos', () => {
    const { itens, removidos } = filtrarReferenciaRemovida(participantes, 'npc', 'n2');
    assert.deepEqual(removidos.map(item => item.id), ['npc:n2']);
    assert.deepEqual(itens.map(item => item.id), ['npc:n1', 'jogador:f1', 'jogador:f2']);
    assert.deepEqual(participantes.map(item => item.id), ['npc:n1', 'npc:n2', 'jogador:f1', 'jogador:f2']);
});

test('catálogo confirmado remove entradas obsoletas e conserva estado dos restantes', () => {
    const { itens, removidos } = filtrarParticipantesDesvinculados(participantes, {
        npcs: new Set(['n1']), jogadores: new Set(['f2']),
    });
    assert.deepEqual(removidos.map(item => item.id), ['npc:n2', 'jogador:f1']);
    assert.equal(itens[0], participantes[0]);
    assert.equal(itens[0].ferimentos, 1);
    assert.equal(itens[1], participantes[3]);
});

test('catálogo indisponível não é interpretado como lista vazia', () => {
    const { itens, removidos } = filtrarParticipantesDesvinculados(participantes, {
        npcs: null, jogadores: undefined,
    });
    assert.deepEqual(itens, participantes);
    assert.equal(removidos.length, 0);
});

test('migração direta confirmada prevalece sobre uma cópia legada obsoleta', () => {
    const lista = listarPersonagensDisponiveis({
        npcs: [], catalogoDiretoConfirmado: true,
        personagensAprovados: [{ ficha_id: 'f2', personagem_nome: 'Rosa' }],
        envios: [{ ficha_id: 'f1', status: 'aprovada', titulo: 'Removida' }],
        participantes: [{ ficha_id: 'f1', ficha_status: 'aprovada' }],
    });
    assert.deepEqual(lista.map(item => item.ref), ['f2']);
});

test('o fallback legado segue disponível quando a RPC dedicada não existe', () => {
    const lista = listarPersonagensDisponiveis({
        npcs: [], catalogoDiretoConfirmado: false,
        envios: [{ ficha_id: 'f1', status: 'aprovada', titulo: 'Rosa' }],
    });
    assert.deepEqual(lista.map(item => item.ref), ['f1']);
});


test('fallback incompleto permite visualizar mas não autoriza remoção automática', async () => {
    const estado = {
        campanhaId: 'c', versaoSessao: 1, modoLocal: false,
        catalogoJogadoresConfirmado: true, catalogoDiretoConfirmado: true,
        personagensAprovados: [{ ficha_id: 'obsoleta' }],
        envios: [{ ficha_id: 'legada', status: 'aprovada' }],
        repositorio: { listarPersonagensAprovados: async () => { throw Error('RPC indisponível'); } },
    };
    await atualizarCatalogoPersonagens({ estado, campanhas: { atualizarConteudoCampanha: async () => {} } });
    assert.equal(estado.catalogoDiretoConfirmado, false);
    assert.equal(estado.catalogoJogadoresConfirmado, false);
    assert.deepEqual(listarPersonagensDisponiveis(estado).map(item => item.ref), ['legada']);
});


test('exclusão confirmada não reaparece ao restaurar backup remoto desatualizado', () => {
    const { itens } = filtrarParticipantesDesvinculados(participantes, {
        npcs: null, jogadores: null,
        removidos: new Set(['npc:n2', 'jogador:f1']),
    });
    assert.deepEqual(itens.map(item => item.id), ['npc:n1', 'jogador:f2']);
});
