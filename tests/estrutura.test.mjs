import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (caminho) => readFileSync(resolve(raiz, caminho), 'utf8');
const paginas = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];
const htmlCompleto = () => [
    ler('index.html'),
    ...paginas.map((pagina) => ler(`views/pages/${pagina}.html`)),
    ler('views/dialogs/criar-sessao.html'),
    ler('views/dialogs/gerenciar-sessoes.html'),
].join('\n');
const codigoControladores = () => [
    ler('js/mesa.js'), ler('js/controllers/diario.js'),
    ler('js/controllers/campanhas.js'), ler('js/controllers/fichas.js'),
    ler('js/controllers/npcs.js'),
].join('\n');

test('todos os campos utilizados pelo controlador existem no HTML', () => {
    const html = htmlCompleto();
    const js = codigoControladores();
    const ids = [...js.matchAll(/porId\('([^']+)'\)/g)].map((encontrado) => encontrado[1]);

    for (const id of new Set(ids)) {
        assert.ok(html.includes(`id="${id}"`), `Campo ausente no HTML: #${id}`);
    }
});

test('as sete páginas estão na barra superior e possuem conteúdos próprios', () => {
    const html = htmlCompleto();
    const nomes = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];
    for (const nome of nomes) {
        assert.ok(html.includes(`data-pagina="${nome}"`));
        assert.ok(html.includes(`data-pagina-container="${nome}"`));
    }
    assert.ok(html.includes('id="salvar-campanha"'));
    assert.ok(html.includes('id="navegacao-mestre"'));
    assert.doesNotMatch(html, /class="lateral-mestre"/);
});

test('não restaram dependências funcionais do compartilhamento antigo SQL 003', () => {
    assert.equal(existsSync(resolve(raiz, 'compartilhar.html')), false);
    assert.equal(existsSync(resolve(raiz, 'js/autorizar.js')), false);
    assert.equal(existsSync(resolve(raiz, 'js/services/fichas.js')), false);
    assert.equal(existsSync(resolve(raiz, 'supabase/003_mestres_leitura.sql')), false);
    assert.equal(existsSync(resolve(raiz, 'tests/compartilhamento.test.mjs')), false);

    for (const arquivo of ['index.html', 'js/mesa.js', 'js/services/campanhas.js']) {
        assert.doesNotMatch(ler(arquivo), /compartilhar\.html|ficha_permissoes|conceder_leitura_ficha/);
    }
});

test('as RPCs chamadas pelo Mestre existem nas migrações 004 a 007', () => {
    const servico = ler('js/services/campanhas.js');
    const migracao = ['004_campanhas_convites.sql', '005_escudo_campanhas.sql',
        '006_fichas_leitura_privada.sql', '007_excluir_campanha_mestre.sql'].map((nome) => ler(`supabase/${nome}`)).join('\n');
    const funcoes = [...servico.matchAll(/chamar\('([^']+)'/g)].map((encontrado) => encontrado[1]);
    assert.equal(funcoes.length, 10);

    for (const funcao of funcoes) {
        assert.ok(migracao.includes(`function public.${funcao}(`), `RPC ausente no SQL: ${funcao}`);
    }
});

test('aba Campanhas apresenta os campos, textos e ações solicitados', () => {
    const html = htmlCompleto();
    assert.match(html, /ESCUDO DO MESTRE/);
    assert.doesNotMatch(html, /marca-emblema|SEU TERRITÓRIO|MESA DO MESTRE/);
    assert.match(html, /id="instrucao-campanhas"/);
    for (const id of [
        'nome-campanha', 'descricao-campanha', 'lista-campanhas',
        'lista-participantes', 'mostrar-convite', 'form-convite',
    ]) assert.ok(html.includes(`id="${id}"`), `Elemento não encontrado: ${id}`);
    const js = codigoControladores();
    for (const texto of ['Selecione uma campanha', 'Crie sua primeira campanha',
        'Selecionar', 'Aceitar entrada', 'Negar entrada', 'Excluir da mesa', 'Adicionar jogador']) {
        assert.ok(html.includes(texto) || js.includes(texto), `Texto não encontrado: ${texto}`);
    }
});

test('SQL 005 é aditivo, protege a lista de jogadores e preserva fichas pessoais', () => {
    const sql = ler('supabase/005_escudo_campanhas.sql');
    assert.match(sql, /add column if not exists descricao/);
    assert.match(sql, /campanha\.mestre_id = \(select auth\.uid\(\)\)/);
    assert.match(sql, /delete from public\.campanha_convites/);
    assert.doesNotMatch(sql, /delete from public\.fichas/);
    assert.match(sql, /revoke execute on function public\.listar_participantes_campanha_mestre/);
});
