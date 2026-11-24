import test from 'node:test';
import assert from 'node:assert/strict';
import { ordenarCampanhas } from '../js/controllers/campanhas.js';

test('campanha ativa fica primeiro sem alterar a lista original', () => {
    const lista = ['a','b','c'].map(campanha_id => ({ campanha_id }));
    assert.deepEqual(ordenarCampanhas(lista,'c').map(x=>x.campanha_id), ['c','a','b']);
    assert.deepEqual(ordenarCampanhas(lista,'b').map(x=>x.campanha_id), ['b','a','c']);
    assert.deepEqual(ordenarCampanhas(lista,null), lista);
    assert.deepEqual(ordenarCampanhas(lista,'inexistente'), lista);
    assert.deepEqual(lista.map(x=>x.campanha_id), ['a','b','c']);
});
