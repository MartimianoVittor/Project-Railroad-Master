import { codigoUtilitarios } from './apoio/fontes.mjs';
// Atualização 53: conforto de leitura acima da menor área bruta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escolherTamanhoHorizontal } from '../js/modules/gradeConsultas.js';

const opcao = (w, h, rolagemHorizontal = false) => ({ w, h, rolagemHorizontal });
const escolhido = (opcoes) => {
    const { w, h } = escolherTamanhoHorizontal(opcoes);
    return [w, h];
};

test('leitura confortável prevalece sobre tamanho estreito de menor área', () => {
    // Exemplo do usuário: 4×10 é menos legível do que 10×6.
    assert.deepEqual(escolhido([opcao(4, 10), opcao(8, 8), opcao(10, 6), opcao(12, 6)]), [10, 6]);
    assert.deepEqual(escolhido([opcao(4, 10), opcao(6, 8), opcao(8, 6), opcao(10, 6), opcao(12, 4)]), [10, 6]);
});

test('não estica sem limites quando o cartão já é legível', () => {
    assert.deepEqual(escolhido([opcao(6, 4), opcao(8, 4), opcao(10, 4), opcao(20, 4)]), [8, 4]);
    assert.deepEqual(escolhido([opcao(8, 6), opcao(10, 6), opcao(12, 6), opcao(22, 6)]), [10, 6]);
});

test('evita faixas compridas demais ou proporções excessivamente verticais', () => {
    assert.deepEqual(escolhido([opcao(6, 12), opcao(8, 10), opcao(10, 8), opcao(12, 8), opcao(14, 6)]), [12, 8]);
});

test('ignora opções com rolagem horizontal quando outras cabem', () => {
    assert.deepEqual(escolhido([opcao(6, 4, true), opcao(8, 4), opcao(4, 8)]), [8, 4]);
    assert.deepEqual(escolhido([opcao(6, 4, true), opcao(8, 6)]), [8, 6]);
});

test('cartão mantém ajuste manual, e movimento continua independente do tamanho', () => {
    const fonte = codigoUtilitarios();
    assert.match(fonte, /return escolherTamanhoHorizontal\(opcoes\)/);
    assert.match(fonte, /if \(!peca\.ajusteManual\)/);
    assert.match(fonte, /atual\.ajusteManual = true/);
    assert.match(fonte, /atual\.posicaoManual = true/);
});
