import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
const diario = () => ler('views/pages/diario.html');
const dialogos = () => ler('views/dialogs/criar-sessao.html') + ler('views/dialogs/gerenciar-sessoes.html');

test('diário mantém seleção, gerenciamento e quadro funcional sem título visual', () => {
    const html = diario() + dialogos();
    for (const id of [
        'seletor-sessoes', 'adicionar-sessao', 'salvar-sessao',
        'gerenciar-sessoes', 'limpar-marcos', 'diario-anotacoes',
        'modal-gerenciar-sessoes', 'lista-gerenciar-sessoes',
    ]) assert.ok(html.includes(`id="${id}"`), `Ausente: ${id}`);
    assert.doesNotMatch(diario(), /id="instrucao-diario"|<label for="seletor-sessoes">Sessão<\/label>/);
    assert.ok(html.includes('Marcos e notas'));
    assert.doesNotMatch(diario(), /<h2>Quadro de ideias<\/h2>/);
    for (const id of ['quadro-mestre', 'zona-quadro-mestre', 'imagem-quadro-mestre', 'limpar-quadro-mestre']) {
        assert.ok(diario().includes(`id="${id}"`), `Quadro sem ${id}`);
    }
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

test('anotações e quadro são preservados e salvos juntos', () => {
    assert.match(ler('css/espacamento-desktop-v3.css'), /grid-template-columns: minmax\(0, 2fr\) minmax\(0, 3fr\)/);
    const controlador = ler('js/controllers/diario.js');
    assert.match(controlador, /sessao\.notas =/);
    assert.match(controlador, /sessao\.quadro =/);
    assert.match(controlador, /estado\.quadro\?\.restaurar/);
});

test('diário e persistência permanecem em módulos próprios', () => {
    assert.match(ler('js/controllers/diario.js'), /criarRepositorio|salvarCampanhaAtual|duplicarSessao|moverSessao/);
    assert.match(ler('js/mesa.js'), /criarControladorDiario/);
    assert.match(ler('js/modules/sessoes.js'), /criarRepositorioSessoes/);
    assert.match(ler('js/mesa.js'), /iniciarQuadroMestre/);
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
