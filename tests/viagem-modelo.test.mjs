import test from 'node:test';
import assert from 'node:assert/strict';
import { criarGrupo, distanciaDoDia, limiteDescanso, normalizarViagens, velocidade } from '../js/modules/viagem/modelo.js';

test('uma viagem v1 conserva os grupos, a seleção e os campos históricos ao passar para v2', () => {
    const antigo = {
        total: 150, ativo: 'segundo',
        grupos: [{ id: 'primeiro' }, { id: 'segundo', percorrido: 45, desde: 12, busca: 'normal',
            viajantes: [{ id: 'npc:1', nome: 'Rosa', km: 30, marcas: { fome: 2 } }] }],
    };
    const original = structuredClone(antigo);
    const atual = normalizarViagens(antigo);
    assert.equal(atual.versao, 2);
    assert.equal(atual.ativa, atual.viagens[0].id);
    const [viagem] = atual.viagens;
    const grupo = viagem.grupos[1];
    assert.equal(viagem.ativo, 'segundo');
    assert.equal(grupo.percorrido, 45);
    assert.equal(grupo.busca, 'nenhuma');
    assert.equal(grupo.viajantes[0].marcas.fome, 2);
    assert.equal(limiteDescanso(grupo), null);
    assert.deepEqual(normalizarViagens(atual), atual);
    assert.deepEqual(antigo, original);
});

test('a velocidade usa o integrante mais lento, e o avanço respeita descanso e destino', () => {
    const grupo = criarGrupo('Correio');
    grupo.viajantes = [{ km: 60, kmDescanso: 80 }, { km: 40, kmDescanso: 45 }];
    grupo.ritmo = 'acelerado';
    grupo.busca = 'rapida';
    assert.equal(velocidade(grupo), 45);
    grupo.desde = 40;
    assert.equal(distanciaDoDia({ total: 100 }, grupo), 5);
    grupo.percorrido = 98;
    assert.equal(distanciaDoDia({ total: 100 }, grupo), 2);
    grupo.desde = 45;
    assert.equal(distanciaDoDia({ total: 100 }, grupo), 0);
});

test('grupos vazios e seleções antigas ausentes têm estado definido', () => {
    const dados = normalizarViagens({ ativa: 'ausente', viagens: [
        null, { id: 'viagem', ativo: 'inexistente', grupos: [null, { id: 'grupo', viajantes: [null] }] },
    ] });
    assert.equal(dados.ativa, 'viagem');
    assert.equal(dados.viagens[0].ativo, 'grupo');
    assert.equal(distanciaDoDia(dados.viagens[0], dados.viagens[0].grupos[0]), 0);
    assert.deepEqual(normalizarViagens(null), { versao: 2, viagens: [], ativa: null });
});
