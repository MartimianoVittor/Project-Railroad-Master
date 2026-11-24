import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('opção padrão é nomeada Cartucho .45 e as barras de Diário/Utilitários entram como cartões principais', () => {
  const js=readFileSync(new URL('../js/modules/personalizacaoMestre.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../css/personalizacao.css',import.meta.url),'utf8');
  assert.match(js, /\['cartucho-45', 'Cartucho \.45'\]/);
  assert.match(js, /#pagina-diario \.barra-sessoes/);
  assert.match(js, /#pagina-utilitarios \.util-barra-consultas/);
  assert.match(js, /rr-botao--cartucho-45/);
  assert.match(css, /\.personalizacao-amostra--botao\.personalizacao-cartucho-45/);
  assert.match(css, /--rr-imagem-cartucho-45/);
  assert.doesNotMatch(css, /\.personalizacao-cartucho-atual\s*\{/);
});

test('cartucho .45 e botões do kit estão orientados para a esquerda no Mestre', () => {
  const css=readFileSync(new URL('../css/personalizacao.css',import.meta.url),'utf8');
  const recurso = css.match(/--rr-imagem-cartucho-45:\s*url\("([^"]+\.svg)"\)/);
  assert.ok(recurso);
  const artwork = readFileSync(new URL(recurso[1], new URL('../css/personalizacao.css', import.meta.url)), 'utf8');
  assert.match(artwork, /scale\(-1 1\)/);
  assert.match(css, /\.personalizacao-amostra--botao\.rr-botao::before {[\s\S]*?scaleX\(-1\)/);
  assert.match(css, /#navegacao-mestre \.aba-navegacao\.aba-cartucho::before\s*\{[^}]*transform: scaleX\(-1\)/);
});
