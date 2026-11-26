import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('NPCs usa pesquisa e criação dentro do primeiro cartão, sem barra superior', () => {
    const pagina = ler('views/pages/npcs.html');
    assert.doesNotMatch(pagina, /class="barra-npcs"/);
    assert.ok(pagina.indexOf('id="novo-npc"') > pagina.indexOf('class="grade-npcs"'));
    assert.ok(pagina.indexOf('id="buscar-npc"') > pagina.indexOf('class="grade-npcs"')); 
    const primeiroCartao = pagina.indexOf('class="cartao-campanha painel-lista-npcs"');
    const aviso = pagina.indexOf('id="contexto-npcs"');
    const grade = pagina.indexOf('class="grade-npcs"');
    assert.ok(grade > -1 && primeiroCartao > grade && aviso > primeiroCartao);
    assert.match(pagina, /id="contexto-npcs"[^>]+hidden/);
});

test('aviso de NPC só ocupa espaço na lista quando há indisponibilidade remota', () => {
    const controller = ler('js/controllers/npcs.js');
    assert.match(controller, /contextoNpc\.hidden = !avisoLocal/);
    assert.match(controller, /habilitado && !podeGravarRemoto\(\)/);
});

test('margens externas desktop são uma só e não afetam a barra mobile', () => {
    const css = ler('css/espacamento-desktop-v3.css');
    assert.match(css, /@media \(min-width: 901px\)/);
    assert.match(css, /--rr-margem-lateral: clamp\(13px, 1\.6vw, 27px\)/);
    assert.match(css, /--rr-margem-superior: clamp\(14px, 1\.55vw, 25px\)/);
    assert.match(css, /gap: var\(--rr-intervalo-cartoes\)/);
    assert.match(css, /\.grade-npcs[\s\S]*?> \* \{\s*margin: 0/);
});
