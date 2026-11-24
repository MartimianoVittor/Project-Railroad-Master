import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
test('controles das fichas não recebem acabamento secundário e detalhe do combate engloba cartões secundários', () => {
    const js = ler('js/modules/personalizacaoMestre.js');
    const internos = js.split('const SELETORES_INTERNOS = [')[1].split('].join')[0];
    assert.doesNotMatch(internos, /cartao-rolagem|ficha-arma|combate-condicao/);
    assert.match(js, /'#painel \.cartao-campanha'/);
    for (const seletor of ['.participante', '.personagem-participante', '.ficha-parte', '.item-npc', '.combate-cartao', '.combate-coluna > .cartao-arma']) assert.ok(internos.includes(seletor));
    assert.match(js, /delete elemento\.dataset\.rrPapel/);
});
test('quadro de consultas reserva espaço para molduras e mantém conteúdo acessível', () => {
    const css = ler('css/personalizacao.css');
    assert.match(css, /\.util-cartao\[data-rr-papel\] \{\s*padding: 9px/);
    assert.match(css, /\.util-cartao\[data-rr-papel\] \.util-cartao-corpo \{[^}]*overflow: auto/);
    assert.match(css, /\.util-cartao\.util-medicao \{[^}]*border-width: 8px/);
});

test('formulário de convite recebe a personalização secundária e mantém o contraste da instrução', () => {
    const js = ler('js/modules/personalizacaoMestre.js');
    const internos = js.split('const SELETORES_INTERNOS = [')[1].split('].join')[0];
    assert.ok(internos.includes('#pagina-campanhas .painel-adicionar-jogador'));
    assert.match(ler('views/pages/campanhas.html'), /class="painel-adicionar-jogador" hidden/);
    assert.match(ler('css/personalizacao.css'), /\.painel-adicionar-jogador\[data-rr-papel\] \.instrucao strong\s*\{\s*color: var\(--rr-leitura-titulo/);
});
