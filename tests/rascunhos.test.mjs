import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRepositorioRascunhos } from '../js/modules/rascunhos.js';

function memoria() {
    const dados = new Map();
    return {
        getItem: (chave) => dados.get(chave) ?? null,
        setItem: (chave, valor) => dados.set(chave, valor),
        dados,
    };
}

test('diário é salvo e recuperado por campanha e por conta', () => {
    const armazenamento = memoria();
    const rascunhos = criarRepositorioRascunhos(armazenamento);
    const salvo = rascunhos.salvar('mestre-1', 'campanha-a', {
        anotacoes: 'O xerife não voltou.',
        ideias: 'Emboscada na estação.',
    });

    assert.ok(salvo.salvoEm);
    assert.equal(rascunhos.carregar('mestre-1', 'campanha-a').ideias, 'Emboscada na estação.');
    assert.deepEqual(rascunhos.carregar('mestre-1', 'campanha-b').anotacoes, '');
    assert.deepEqual(rascunhos.carregar('mestre-2', 'campanha-a').ideias, '');
    assert.equal(armazenamento.dados.size, 1);
});

test('rascunhos inválidos não impedem abrir o diário', () => {
    const armazenamento = memoria();
    const rascunhos = criarRepositorioRascunhos(armazenamento);
    armazenamento.setItem('railroad_mestre_rascunho:v1:mestre:mesa', '{json inválido');

    assert.deepEqual(rascunhos.carregar('mestre', 'mesa'), {
        anotacoes: '', ideias: '', salvoEm: null,
    });
});

test('limita os textos e não salva sem campanha selecionada', () => {
    const rascunhos = criarRepositorioRascunhos(memoria());
    assert.throws(() => rascunhos.salvar('mestre', '', { ideias: 'x' }), /Selecione uma campanha/);
    const salvo = rascunhos.salvar('mestre', 'mesa', { ideias: 'a'.repeat(90000) });
    assert.equal(salvo.ideias.length, 50000);
});
