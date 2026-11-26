import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sessões: linhas compactas com ações juntas e ordem acessível pelo teclado', () => {
    const css = ler('css/sessoes.css');
    const js = ler('js/controllers/diario.js');
    assert.match(css, /\.modal-sessoes \.linha-gerenciar\s*\{[^}]*display: grid;[^}]*grid-template-columns: 28px minmax\(0, 1fr\) max-content/s);
    assert.match(css, /\.modal-sessoes \.acoes-gerenciar\s*\{[^}]*flex-wrap: nowrap/);
    assert.match(js, /subir\.disabled = indice === 0/);
    assert.match(js, /descer\.disabled = indice === estado\.sessoes\.length - 1/);
    assert.match(js, /botao\('Editar'/);
    assert.match(js, /botao\('Duplicar'/);
    assert.match(js, /const excluir = botao\('Excluir'/);
});

test('prévia: fotos lado a lado e campos em coluna direita sem rolagem interna', () => {
    const css = ler('css/personalizacao.css');
    const html = ler('views/dialogs/personalizacao.html');
    assert.match(css, /#previa-mestre > \.rr-previa-cartao\[data-rr-papel="principal"\]\s*\{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1\.05fr\) minmax\(0, \.95fr\)/s);
    assert.match(css, /#previa-mestre \{[^}]*overflow: hidden/s);
    assert.ok(html.includes('Notas da sessão'));
    assert.ok(html.includes('>Botão</span>'));
    assert.ok(!html.includes('>Campanhas</span>'));
});
