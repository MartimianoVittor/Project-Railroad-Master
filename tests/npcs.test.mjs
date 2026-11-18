import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    ARMAS_NPC, CONDICOES_NPC, TRACOS_NPC, LIMITE_NPCS,
    criarNpc, normalizarNpc, rotuloNivelNpc,
} from '../js/modules/npcs.js';
import { criarRepositorioNpcs } from '../js/services/npcsLocal.js';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

function memoria() {
    const dados = new Map();
    return {
        dados,
        getItem: (chave) => dados.get(chave) ?? null,
        setItem: (chave, valor) => dados.set(chave, valor),
    };
}

test('NPCs simplificados e completos possuem campos do sistema Railroad', () => {
    const simples = criarNpc();
    const completo = criarNpc('completa');
    assert.equal(simples.tipo, 'simples');
    assert.equal(completo.tipo, 'completa');
    assert.equal(Object.keys(completo.tracos).length, 12);
    assert.deepEqual(Object.keys(completo.condicoes), CONDICOES_NPC.map(([chave]) => chave));
    assert.deepEqual(Object.keys(completo.armas), ARMAS_NPC.map(([chave]) => chave));
    assert.equal(TRACOS_NPC[0], 'Sangue Quente');
    assert.match(rotuloNivelNpc(4), /d12/);
    assert.notEqual(simples.id, completo.id);
});

test('NPCs ficam separados por conta e campanha, sem escrita no Supabase', () => {
    const armazenamento = memoria();
    const repo = criarRepositorioNpcs(armazenamento);
    const npc = { ...criarNpc('completa'), nome: 'Xerife', papel: 'Aliado' };
    repo.salvar('mestre-A', 'campanha-1', [npc]);
    assert.equal(repo.carregar('mestre-A', 'campanha-1')[0].nome, 'Xerife');
    assert.deepEqual(repo.carregar('mestre-A', 'campanha-2'), []);
    assert.deepEqual(repo.carregar('mestre-B', 'campanha-1'), []);
    assert.deepEqual(repo.carregar('', 'campanha-1'), []);
    assert.equal(armazenamento.dados.size, 1);
});

test('valida nome, limita valores e rejeita dados inválidos', () => {
    const repo = criarRepositorioNpcs(memoria());
    assert.throws(() => repo.salvar('u', 'c', [{ ...criarNpc(), nome: '  ' }]), /nome/i);
    assert.throws(() => repo.salvar('u', null, []), /campanha/i);
    assert.throws(() => repo.salvar('u', 'c', Array.from({ length: LIMITE_NPCS + 1 }, () => criarNpc())), /máximo/);
    const npc = normalizarNpc({ nome: 'A'.repeat(140), tipo: 'completa',
        tracos: { 'Mira Afiada': 88 }, condicoes: { sede: -5 },
        armas: { primaria: { bonus: { corpo: 20 }, municao: -100 } },
    });
    assert.equal(npc.nome.length, 100);
    assert.equal(npc.tracos['Mira Afiada'], 4);
    assert.equal(npc.condicoes.sede, 0);
    assert.equal(npc.armas.primaria.bonus.corpo, 3);
    assert.equal(npc.armas.primaria.municao, 0);
});

test('falha de gravação não finge salvar e registros corrompidos não bloqueiam a interface', () => {
    const repo = criarRepositorioNpcs({
        getItem: () => '{invalido',
        setItem: () => { throw new Error('quota'); },
    });
    assert.deepEqual(repo.carregar('u', 'c'), []);
    assert.throws(() => repo.salvar('u', 'c', [{ ...criarNpc(), nome: 'NPC' }]), /Não foi possível salvar/);
});

test('nova aba possui consulta, edição e lista sem carregar quadro privado dos jogadores', () => {
    const html = ler('views/pages/npcs.html');
    const controlador = ler('js/controllers/npcs.js');
    const css = ler('css/npcs.css');
    for (const id of [
        'pagina-npcs', 'novo-npc', 'lista-npcs', 'buscar-npc', 'npc-consulta',
        'npc-detalhes', 'form-npc', 'npc-tipo', 'npc-nome', 'npc-papel',
        'npc-campos-simples', 'npc-campos-completos', 'npc-grade-tracos',
        'npc-grade-condicoes', 'npc-grade-armas', 'salvar-npc', 'excluir-npc',
    ]) assert.ok(html.includes(`id="${id}"`), `Ausente: #${id}`);
    assert.match(controlador, /criarNovo|editarSelecionado|salvarNpc|excluirSelecionado/);
    assert.match(css, /\.npc-detalhes, \.campos-form-npc\s*\{[^}]*overflow: auto/s);
    assert.doesNotMatch(html, /quadro-mestre|quadro-jogador|desenhoCanvas/);
    assert.match(ler('index.html'), /data-pagina="npcs"/);
    assert.match(ler('js/core/carregarInterface.js'), /'npcs'/);
});

test('marcador de convite fica com o jogador e Excluir da mesa abaixo dos personagens à direita', () => {
    const controlador = ler('js/controllers/campanhas.js');
    const css = ler('css/campanhas.css');
    assert.match(controlador, /cabecalho\.append\(\s*jogador,\s*elemento\('span', `selo-status status-\$\{participante\.conviteStatus\}`/s);
    assert.match(controlador, /personagens\.append\(acoesExclusao\)/);
    assert.doesNotMatch(controlador, /cabecalho\.append\(acoesJogador\)/);
    assert.match(css, /\.acoes-exclusao\s*\{[^}]*justify-content: flex-end/s);
});
