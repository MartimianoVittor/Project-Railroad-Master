import { codigoUtilitarios } from './apoio/fontes.mjs';
// Testes estruturais para as alças de redimensionamento de Utilitários.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const fonte = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

test('quatro botões de tamanho foram substituídos por três alças', () => {
    const ctrl = codigoUtilitarios();
    assert.match(ctrl, /\['largura', 'Arrastar para ajustar a largura'/);
    assert.match(ctrl, /\['altura', 'Arrastar para ajustar a altura'/);
    assert.match(ctrl, /\['ambos', 'Arrastar o canto/);
    assert.match(ctrl, /alca\.dataset\.redimensionar = lado/);
    assert.doesNotMatch(ctrl, /botaoAjuste\('w-|botaoAjuste\('h-/);
    assert.match(ctrl, /botaoAjuste\('remover'/);
});

test('alças têm suporte a ponteiro, captura, prévia e cancelamento', () => {
    const ctrl = codigoUtilitarios();
    assert.match(ctrl, /function iniciarRedimensionamento\(evento\)/);
    assert.match(ctrl, /alca\.setPointerCapture\(evento\.pointerId\)/);
    assert.match(ctrl, /item\.style\.width = /);
    assert.match(ctrl, /item\.style\.height = /);
    assert.match(ctrl, /pointercancel/);
    assert.match(ctrl, /confirmarTamanho\(id, novo\.w, novo\.h\)/);
});

test('alças aceitam teclado, e cabeçalho permanece arrastável', () => {
    const ctrl = codigoUtilitarios();
    const css = fonte('css/utilitarios.css');
    assert.match(ctrl, /alca\.tabIndex = 0/);
    assert.match(ctrl, /evento\.target\.closest\('\[data-redimensionar\]'\)/);
    assert.match(ctrl, /const cabecalho = evento\.target\.closest\('\.util-cartao-cabecalho'\)/);
    assert.match(ctrl, /grade\.addEventListener\('keydown'/);
    assert.match(css, /\.util-alca-largura/);
    assert.match(css, /\.util-alca-altura/);
    assert.match(css, /\.util-alca-ambos/);
    assert.match(css, /touch-action:none/);
});


test('redimensionamento aceita passos ímpares e remoção fica antes do arraste', () => {
    const ctrl = codigoUtilitarios();
    const css = fonte('css/utilitarios.css');
    const grid = fonte('js/modules/gradeConsultas.js');
    assert.match(ctrl, /cabecalho\.append\(botaoAjuste\('remover'[\s\S]*?, arrastar\)/);
    assert.match(ctrl, /closest\('\[data-redimensionar\], \[data-acao\]'\)/);
    assert.match(ctrl, /Math\.round\(valor \/ \(ladoCelula \+ GAP\)\)/);
    assert.match(ctrl, /passoInteiro\(w, MIN_LADO_CARTAO, maximoLargura\)/);
    assert.match(ctrl, /passoInteiro\(parseInt\(p\.w/);
    assert.match(grid, /w: passoInteiro\(peca\.w/);
    assert.match(grid, /h: passoInteiro\(peca\.h/);
    assert.match(css, /--util-celula:20px/);
    assert.match(css, /\.util-cartao-cabecalho \.util-remover/);
});
