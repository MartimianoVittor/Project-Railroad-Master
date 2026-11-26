import test from 'node:test';
import assert from 'node:assert/strict';
import {
    versionarImportacoesJs, versionarImportacoesCss, versionarRecursosHtml,
} from '../scripts/lib/versionamento.mjs';

const versao = 'mesa-44';
test('importações JS aceitam cache legado, preservam origem e são idempotentes', () => {
    const fonte = `import X from './x.js?v=antigo';\nimport('./outro.js?v=mesa-43');\nimport '/externo';`;
    const esperado = `import X from './x.js?v=mesa-44';\nimport('./outro.js?v=mesa-44');\nimport '/externo';`;
    assert.equal(versionarImportacoesJs(fonte, versao), esperado);
    assert.equal(versionarImportacoesJs(esperado, versao), esperado);
});
test('imports CSS normalizam cache e não alteram urls de imagens', () => {
    const fonte = `@import url('./tema.css?v=scrollbars-2');\n.a {background: url('../a.svg')}`;
    const esperado = `@import url('./tema.css?v=mesa-44');\n.a {background: url('../a.svg')}`;
    assert.equal(versionarImportacoesCss(fonte, versao), esperado);
    assert.equal(versionarImportacoesCss(esperado, versao), esperado);
});
test('HTML unifica cache de CSS/JS locais sem tocar em endereços externos', () => {
    const fonte = `<link href="css/condicoes.css?v=condicoes-2"><link href="https://site.com/r.css"><script src='js/mesa.js'>`;
    const esperado = `<link href="css/condicoes.css?v=mesa-44"><link href="https://site.com/r.css"><script src='js/mesa.js?v=mesa-44'>`;
    assert.equal(versionarRecursosHtml(fonte, versao), esperado);
    assert.equal(versionarRecursosHtml(esperado, versao), esperado);
});
