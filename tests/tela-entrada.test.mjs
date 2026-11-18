import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('a tela inicial habilita modo de entrada antes de carregar o JavaScript', () => {
    const html = ler('index.html');
    assert.match(html, /<html lang="pt-BR" class="modo-entrada">/);
    assert.match(html, /<body class="modo-entrada">/);
    assert.match(html, /id="entrar"[^>]*>Entrar com Google<\/button>/);
});

test('a autenticação troca o modo de rolagem conforme o usuário', () => {
    const js = ler('js/mesa.js');
    assert.match(js, /document\.documentElement\.classList\.toggle\('modo-entrada', !usuario\)/);
    assert.match(js, /document\.body\.classList\.toggle\('modo-entrada', !usuario\)/);
});

test('o desktop libera rolagem no login e mantém o painel com rolagem interna', () => {
    const css = ler('css/responsivo.css');
    assert.match(css, /html\.modo-entrada\s*\{[^}]*overflow-y:\s*auto/s);
    assert.match(css, /body\.modo-entrada\s*\{[^}]*overflow-y:\s*auto/s);
    assert.match(css, /body\.modo-entrada main\s*\{[^}]*display:\s*block/s);
    assert.match(css, /\.painel\s*\{[^}]*overflow:\s*hidden/s);
});
