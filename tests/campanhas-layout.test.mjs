import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

test('botão Atualizar aparece ao lado do título e descrição da campanha selecionada', () => {
    const html = ler('views/pages/campanhas.html');
    const cabecalho = html.match(/<div class="cabecalho-campanha">([\s\S]*?)<\/div>\s*<div class="cabecalho-jogadores">/)?.[1];

    assert.ok(cabecalho, 'Cabeçalho da campanha não encontrado');
    for (const id of ['titulo-campanha', 'descricao-campanha-ativa', 'atualizar-campanha']) {
        assert.ok(cabecalho.includes(`id="${id}"`), `Elemento ausente: ${id}`);
    }

    const mesa = ler('js/mesa.js');
    assert.match(mesa, /porId\('atualizar-campanha'\)\.addEventListener\('click'/);
    assert.match(mesa, /await atualizarCampanhas\(estado\.campanhaId\)/);
});

test('lista compacta coloca jogador e personagens em colunas, com ações próximas dos nomes', () => {
    const css = ler('css/campanhas.css');
    const controlador = ler('js/controllers/campanhas.js');

    assert.match(css, /\.participante\s*\{\s*display:\s*grid;\s*grid-template-columns:/);
    assert.match(css, /\.acoes-participante\s*\{[^}]*flex:\s*0 0 auto/s);
    assert.match(css, /\.acoes-exclusao\s*\{[^}]*justify-content:\s*flex-end/s);
    assert.match(controlador, /personagens\.append\(acoesExclusao\)/);
    assert.match(controlador, /item\.append\(acoes\)/);
    assert.doesNotMatch(controlador, /linha\.append\(rodape\)/);
});

test('telas estreitas empilham jogador e personagens sem exigir rolagem horizontal da página', () => {
    const css = ler('css/responsivo.css');
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.participante\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
});
