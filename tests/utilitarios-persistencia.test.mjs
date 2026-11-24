import test from 'node:test';
import assert from 'node:assert/strict';
import { chaveConsultas, carregarConsultas, gravarConsultas } from '../js/services/consultasLocal.js';
import { CONSULTAS_PADRAO } from '../js/modules/catalogoRegras.js';

test('ler uma consulta v1 conserva o tamanho manual, a posição e o escopo', () => {
    const estado = { usuario: { id: 'mestre' }, campanhaId: 'norte', modoLocal: true };
    const chave = chaveConsultas(estado);
    assert.equal(chave, 'railroad-mestre-utilitarios-v1:local:mestre:norte');
    assert.notEqual(chave, chaveConsultas({ ...estado, modoLocal: false }));
    assert.notEqual(chave, chaveConsultas({ ...estado, campanhaId: 'sul' }));
    const id = CONSULTAS_PADRAO[0].itens[0];
    const cartoes = [{ id, x: 2, y: 1, w: 7, h: 5, ajusteManual: true, posicaoManual: true, manual: true }];
    const atual = { id: 'u:consulta', nome: 'Atalhos', cartoes };
    const memoria = new Map([[chave, JSON.stringify({ versao: 1, salvas: [atual], atual })]]);
    const storage = { getItem: (k) => memoria.get(k), setItem: (k, v) => memoria.set(k, v) };
    const carregado = carregarConsultas(storage, chave);
    assert.deepEqual(carregado.atual, atual);
    gravarConsultas(storage, chave, carregado.salvas, { ...atual, nome: 'Rascunho' });
    assert.equal(carregarConsultas(storage, chave).salvas[0].nome, 'Atalhos');
    assert.equal(carregarConsultas(storage, chave).atual.nome, 'Rascunho');
});

test('rascunho ilegível abre o padrão e falha de escrita chega ao controlador', () => {
    const armazenamento = { getItem: () => '{', setItem: () => { throw new Error('quota'); } };
    const { salvas, atual } = carregarConsultas(armazenamento, 'chave');
    assert.equal(atual.nome, CONSULTAS_PADRAO[0].nome);
    assert.deepEqual(salvas, []);
    assert.throws(() => gravarConsultas(armazenamento, 'chave', salvas, atual), /quota/);
});
