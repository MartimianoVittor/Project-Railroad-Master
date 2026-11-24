import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = nome => readFileSync(new URL(`../${nome}`, import.meta.url), 'utf8');

test('Mestre utiliza a engrenagem e tamanhos do Jogador', () => {
  const css = ler('css/processamento.css');
  assert.match(css, /repeating-conic-gradient/);
  assert.match(css, /animation: rr-girar 1\.4s linear infinite/);
  assert.match(css, /\.rr-aviso-processamento \.rr-roda \{ width: 22px; height: 22px/);
});

test('Indicador não bloqueante mantém atraso e diálogo bloqueante é opcional', () => {
  const js = ler('js/core/processamento.js');
  assert.match(js, /bloquear = true/);
  assert.match(js, /const animar = opcoes\?\.bloquear !== false/);
  assert.match(js, /janela\.showModal\(\)/);
  assert.match(js, /350 - \(Date\.now\(\) - inicio\)/);
});
