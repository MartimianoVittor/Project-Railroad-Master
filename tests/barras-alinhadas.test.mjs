import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
test('cinco barras iguais; NPCs sem barra própria; quadro editável sem título', () => {
  const css = ler('css/espacamento-desktop-v3.css');
  for (const seletor of ['#pagina-diario > .barra-sessoes', '#pagina-fichas > .barra-consulta-fichas',
    '#pagina-combate > .combate-barra', '#pagina-utilitarios > .util-barra-consultas', '#pagina-viagem .vg-top']) {
    assert.ok(css.includes(seletor), `Falta barra: ${seletor}`);
  }
  assert.match(css, /flex: 0 0 66px;[\s\S]*?height: 66px;[\s\S]*?min-height: 66px;[\s\S]*?max-height: 66px;/);
  assert.doesNotMatch(ler('views/pages/npcs.html'), /class="barra-npcs"/);
  const diario = ler('views/pages/diario.html');
  assert.match(diario, /id="quadro-mestre"/);
  assert.doesNotMatch(diario, /<h2>Quadro de ideias<\/h2>/);
});
