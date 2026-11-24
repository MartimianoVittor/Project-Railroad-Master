import { codigoUtilitarios } from './apoio/fontes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const texto = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
const js = codigoUtilitarios();
const css = texto('css/utilitarios.css');

test('título mantém a mesma fonte em vez de crescer com a escala do cartão', () => {
  assert.match(css, /\.util-cartao-cabecalho h4\s*\{[^}]*font-size:\.86rem/s);
  assert.doesNotMatch(css, /\.util-cartao-cabecalho h4\s*\{[^}]*font-size:calc\([^}]*--util-escala-conteudo/s);
  assert.match(js, /function ajustarEscalaConteudo\(cartao\)/);
  assert.match(js, /cartao\.style\.setProperty\('--util-escala-conteudo'/);
});

test('parágrafos, notas e tabelas crescem de acordo com o cartão', () => {
  for (const selector of ['.util-cartao-corpo p', '.util-cartao-corpo li', '.util-tabela-regras', '.util-tabela-regras th', '.util-tabela-regras :is(th,td)']) {
    assert.ok(css.includes(selector), `sem escala para ${selector}`);
  }
  assert.match(css, /\.util-cartao-corpo\s*\{\s*display:flex;\s*flex-direction:column/);
  assert.match(css, /\.util-cartao-corpo > \.util-tabela-rolagem\s*\{[^}]*flex:1 1 auto/s);
  assert.match(css, /\.util-cartao-corpo > \.util-tabela-rolagem > \.util-tabela-regras\s*\{[^}]*height:100%/s);
});

test('escala só aumenta até quando todas as linhas permanecem visíveis', () => {
  assert.match(js, /tabela\.scrollHeight <= tabela\.clientHeight \+ 1/);
  assert.match(js, /elementosTabela\.every\(\(celula\) => celula\.scrollHeight <= celula\.clientHeight \+ 2\)/);
  assert.match(js, /tabela \? tabela\.scrollHeight - tabela\.clientHeight : 0/);
  assert.match(js, /const meio = \(inferior \+ superior\) \/ 2/);
  assert.match(js, /Math\.max\(1, inferior - 0\.015\)/);
});

test('não altera o tamanho em células do usuário nem o arraste existente', () => {
  assert.match(js, /if \(pos\.ajusteManual\) article\.classList\.add\('util-tamanho-manual'\)/);
  assert.match(js, /else ajustarEscalasQuadro\(\)/);
  assert.match(js, /item\.style\.removeProperty\('--util-escala-conteudo'\)/);
  assert.doesNotMatch(js, /atual\.escala\s*=/);
});
