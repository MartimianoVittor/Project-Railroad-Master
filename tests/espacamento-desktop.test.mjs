import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('a folha desktop de respiro é carregada por último e respeita a versão de publicação', () => {
  const html = ler('index.html');
  assert.match(html, /css\/espacamento-desktop-v3\.css\?v=mesa-44/);
  assert.ok(html.indexOf('css/espacamento-desktop-v3.css') > html.indexOf('css/viewport-colunas.css'));
});

test('espaçamento pertence ao contêiner, sem margens duplicadas nos cartões', () => {
  const css = ler('css/espacamento-desktop-v3.css');
  assert.match(css, /@media \(min-width: 901px\)/);
  for (const token of ['--rr-margem-lateral','--rr-intervalo-cartoes','--rr-intervalo-secoes']) {
    assert.ok(css.includes(token), `Ausência de ${token}`);
  }
  assert.match(css, /gap: var\(--rr-intervalo-cartoes\)/);
  assert.match(css, /\.grade-utilitarios\) > \* \{\s*margin: 0/);
  assert.match(css, /#pagina-diario \.barra-sessoes/);
  assert.match(css, /#pagina-utilitarios \.util-barra-consultas/);
  assert.doesNotMatch(css, /--rr-mobile-rodape/);
  assert.match(css, /--rr-margem-superior/);
  assert.match(css, /--rr-margem-lateral/);
  assert.match(css, /--rr-margem-inferior/);
  assert.match(css, /\.util-catalogo > \.util-lista-mecanicas/);
  assert.match(css, /padding-bottom: 6px/);
  assert.match(css, /--rr-margem-lateral: clamp\(13px, 1\.6vw, 27px\)/);
  assert.match(css, /--rr-margem-superior: clamp\(14px, 1\.55vw, 25px\)/);
  assert.match(css, /--rr-margem-inferior: clamp\(14px, 1\.55vw, 25px\)/);
});
