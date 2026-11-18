import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
const diario = () => ler('views/pages/diario.html');
const dialogos = () => ler('views/dialogs/criar-sessao.html') + ler('views/dialogs/gerenciar-sessoes.html');

test('diário conserva seleção, ferramentas, quadro e gerenciamento de sessões', () => {
    const html = diario() + dialogos();
    for (const id of [
        'seletor-sessoes', 'adicionar-sessao', 'salvar-sessao',
        'gerenciar-sessoes', 'limpar-marcos', 'diario-anotacoes', 'quadro-mestre',
        'zona-quadro-mestre', 'modal-gerenciar-sessoes', 'lista-gerenciar-sessoes',
    ]) assert.ok(html.includes(`id="${id}"`), `Ausente: ${id}`);
    assert.doesNotMatch(diario(), /id="instrucao-diario"|<label for="seletor-sessoes">Sessão<\/label>/);
    assert.ok(html.includes('Marcos e notas'));
});

test('o seletor fica à esquerda e as ações à direita', () => {
    const html = diario();
    assert.match(html, /class="grupo-seletor-sessoes"/);
    assert.match(html, /class="acoes-barra-sessoes"/);
    assert.ok(html.indexOf('grupo-seletor-sessoes') < html.indexOf('acoes-barra-sessoes'));
    const css = ler('css/diario.css');
    assert.match(css, /\.barra-sessoes[^}]*justify-content: space-between/s);
    assert.match(css, /\.acoes-barra-sessoes[^}]*margin-left: auto/s);
});

test('título do quadro compartilha a linha com suas ferramentas', () => {
    const html = diario();
    assert.match(html, /class="cabecalho-quadro"[^>]*>\s*<h2>Quadro de ideias<\/h2>\s*<div class="ferramentas-quadro"/);
    const css = ler('css/diario.css');
    assert.match(css, /\.cabecalho-quadro\s*\{[^}]*display: flex/s);
    assert.match(css, /grid-template-columns: minmax\(0, 2fr\) minmax\(0, 3fr\)/);
});

test('diário, quadro e persistência estão em módulos próprios', () => {
    assert.match(ler('js/controllers/diario.js'), /criarRepositorio|salvarCampanhaAtual|duplicarSessao|moverSessao/);
    assert.match(ler('js/mesa.js'), /criarControladorDiario|iniciarQuadroMestre/);
    assert.match(ler('js/modules/sessoes.js'), /criarRepositorioSessoes/);
});

test('a criação de sessão usa diálogo e descrição de 25 caracteres', () => {
    const html = dialogos();
    const js = ler('js/controllers/diario.js');
    for (const id of [
        'modal-criar-sessao', 'form-nova-sessao', 'nome-nova-sessao',
        'descricao-nova-sessao', 'contador-descricao-sessao', 'confirmar-sessao',
    ]) assert.ok(html.includes(`id="${id}"`), `Elemento ausente: ${id}`);
    assert.match(html, /id="descricao-nova-sessao"[^>]*maxlength="25"/);
    assert.ok(js.includes('Sessão ${String(indice + 1)'));
    assert.match(js, /numero-sessao-gerenciar/);
    assert.match(js, /descricao-sessao-gerenciar/);
    assert.match(js, /abrirFormularioSessao/);
    assert.match(js, /moverSessao\(estado\.sessoes, origem, sessao\.id, posicao\)/);
});
