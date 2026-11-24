import { codigoUtilitarios } from './apoio/fontes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { alturaInicialCartao, ALTURAS_INICIAIS_GRADE } from '../js/modules/gradeConsultas.js';
import { MECANICAS_POR_ID } from '../js/modules/catalogoRegras.js';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

test('alturas iniciais de cartões seguem 4, 6 ou 8 células', () => {
    assert.deepEqual(ALTURAS_INICIAIS_GRADE, [4, 6, 8]);
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(alturaInicialCartao), [4, 4, 4, 4, 6, 6, 8, 8]);
    assert.equal(alturaInicialCartao(9), 10); // evita cortes em tabelas extensas
});

test('pontos iniciais contém somente as três escalas e o resumo', () => {
    const regra = MECANICAS_POR_ID.get('criacao-pontos');
    assert.deepEqual(regra.itens, ['Padrão: 20 pontos', 'Herói: 25 pontos', 'Lenda: 30 pontos']);
    assert.doesNotMatch(regra.itens.join(' '), /nível 0 é permanente/i);
});

test('dinheiro inicial contém somente as três escalas de valores', () => {
    const regra = MECANICAS_POR_ID.get('dinheiro-inicial');
    assert.deepEqual(regra.itens, ['Padrão: $50 ou 2d10 + $35', 'Herói: $75 ou 2d12 + $60', 'Lenda: $110 ou 3d12 + $95']);
    assert.doesNotMatch(regra.itens.join(' '), /armas começam descarregadas|roupas básicas são gratuitas/i);
});

test('cálculo automático prefere alturas padronizadas e preserva conteúdo longo', () => {
    const controlador = codigoUtilitarios();
    assert.match(controlador, /alturaInicialCartao\(/);
    const grade = ler('js/modules/gradeConsultas.js');
    assert.match(grade, /ALTURAS_INICIAIS_GRADE/);
    assert.match(controlador, /escolherTamanhoHorizontal\(opcoes\)/);
    assert.match(controlador, /ajusteManual/);
});
