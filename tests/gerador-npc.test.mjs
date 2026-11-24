import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarNpc, normalizarNpc, validarNpc, TRACOS_NPC, ARMAS_NPC } from '../js/modules/npcs.js';
import { ARQUETIPOS_NPC, sortearDadosNpc } from '../js/modules/npcs/gerador.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
const aleatorioFixo = () => 0.2;

test('todos os arquétipos geram fichas completas, coerentes e válidas em 20/25/30 pontos', () => {
    for (const { id, papel, profissao, tracos: especialidades } of ARQUETIPOS_NPC) {
        for (const pontos of [20, 25, 30]) {
            const npc = sortearDadosNpc(criarNpc('completa'), {
                arquetipo: id, pontos, aleatorio: aleatorioFixo,
            });
            assert.equal(validarNpc(normalizarNpc(npc)).nome, npc.nome);
            assert.equal(npc.papel, papel);
            assert.equal(npc.profissao, profissao);
            assert.equal(npc.tipo, 'completa');
            assert.equal(Object.values(npc.tracos).reduce((a,b) => a+b, 0), pontos);
            assert.deepEqual(Object.keys(npc.tracos), TRACOS_NPC);
            assert.ok(Object.values(npc.tracos).every((n) => n >= 1 && n <= 4), `${id}: nível 0 inesperado`);
            assert.ok(especialidades.includes(npc.tracoPrincipal));
            assert.equal(npc.nivelPrincipal, 4);
            assert.ok(npc.descricao.length > 30);
            assert.match(npc.notas, /Objetivo:.*\nSegredo do mestre:/s);
            assert.ok(npc.apelido && npc.linguas && npc.fama && npc.palavra && npc.dinheiro);
            assert.ok(npc.itens.length >= 2);
            assert.ok(npc.capacidadePersonagem >= npc.itens.reduce((s, item) => s + item.tamanho * item.quantidade, 0));
            for (const [chave] of ARMAS_NPC) {
                assert.ok(Object.hasOwn(npc.armas[chave], 'municao'));
                assert.deepEqual(Object.keys(npc.armas[chave].bonus), ['corpo','curta','media','longa']);
            }
            assert.deepEqual(Object.values(npc.condicoes), [0,0,0,0]);
        }
    }
});

test('regeneração preserva id, imagem e inventário existente sem mutar a origem', () => {
    const anterior = criarNpc('completa');
    anterior.nome = 'Anterior';
    anterior.itens = [{ nome:'Mapa', local:'personagem', quantidade:1, tamanho:1 }];
    anterior.imagem = 'data:image/png;base64,eA==';
    const depois = sortearDadosNpc(anterior, { arquetipo:'guia', pontos:30, aleatorio:() => 0.5 });
    assert.equal(depois.id, anterior.id);
    assert.equal(depois.imagem, anterior.imagem);
    assert.deepEqual(depois.itens, anterior.itens);
    assert.notEqual(depois.itens, anterior.itens);
    assert.equal(anterior.nome, 'Anterior');
    assert.equal(depois.papel, 'Guia');
    assert.equal(Object.values(depois.tracos).reduce((a,b)=>a+b,0), 30);
});

test('geração controla valores de pontos e permite sortear o arquétipo', () => {
    assert.throws(() => sortearDadosNpc(criarNpc(), { pontos: 100 }), RangeError);
    const npc = sortearDadosNpc(criarNpc(), { arquetipo: 'aleatorio', pontos:20, aleatorio:()=>0 });
    assert.equal(npc.papel, ARQUETIPOS_NPC[0].papel);
    assert.equal(Object.values(npc.tracos).reduce((a,b)=>a+b,0), 20);
});

test('janela de geração oferece opções e mantém os botões junto a cancelar e salvar', () => {
    const html = ler('views/pages/npcs.html');
    const controller = ler('js/controllers/npcs.js');
    assert.ok(ARQUETIPOS_NPC.length >= 20);
    assert.equal(new Set(ARQUETIPOS_NPC.map(({id}) => id)).size, ARQUETIPOS_NPC.length);
    for (const id of ['modal-gerador-npc','gerar-npc-aleatorio','gerar-salvar-npc','npc-gerador-arquetipo',
        'npc-gerador-pontos','npc-gerador-personalidade','npc-gerador-objetivo','npc-gerador-equipamento',
        'npc-gerador-preservar-itens','abrir-gerador-npc','cancelar-gerador-npc']) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    const posicao = ["cancelar-npc", "abrir-gerador-npc", "salvar-npc"].map((id) => html.indexOf(`id="${id}"`));
    assert.ok(posicao[0] < posicao[1] && posicao[1] < posicao[2]);
    assert.ok(html.indexOf('id="modal-gerador-npc"') > html.indexOf('id="form-npc"'));
    assert.doesNotMatch(html, /npc-gerador-toolbar|npc-criar-rapido/);
    assert.match(controller, /ARQUETIPOS_NPC\.map\(/);
    assert.match(controller, /modal-gerador-npc'\)\.showModal\(\)/);
    assert.match(controller, /await salvarNpc\(\)/);
});

test('objetivo, comportamento e quantidade de itens obedecem às opções escolhidas', () => {
    const ficha = criarNpc('completa');
    const base = { arquetipo:'ferroviario', pontos:20, aleatorio:aleatorioFixo };
    const expandido = sortearDadosNpc(ficha, { ...base, personalidade:'cordial', objetivo:'misterio', equipamento:'ampliado' });
    const leve = sortearDadosNpc(ficha, { ...base, personalidade:'astuto', objetivo:'busca', equipamento:'leve' });
    assert.match(expandido.descricao, /gentileza/);
    assert.match(expandido.notas, /Investigar um segredo/);
    assert.ok(expandido.itens.length >= 5);
    assert.match(leve.descricao, /Observa as intenções/);
    assert.match(leve.notas, /Encontrar alguém/);
    assert.equal(leve.itens.length, 2);
    assert.equal(Object.values(leve.tracos).reduce((a,b)=>a+b,0), 20);
});

test('opção de substituir inventário é explícita e deixa retrato intacto', () => {
    const original = criarNpc('completa');
    original.imagem = 'data:image/png;base64,eA==';
    original.itens = [{local:'montaria', nome:'Alforge antigo', quantidade:1, tamanho:2}];
    const preservado = sortearDadosNpc(original, {arquetipo:'ferreiro', equipamento:'ampliado', aleatorio:aleatorioFixo});
    const substituido = sortearDadosNpc(original, {arquetipo:'ferreiro', equipamento:'ampliado', preservarItens:false, aleatorio:aleatorioFixo});
    assert.deepEqual(preservado.itens, original.itens);
    assert.ok(substituido.itens.length > original.itens.length);
    assert.equal(substituido.imagem, original.imagem);
    assert.deepEqual(original.itens, [{local:'montaria', nome:'Alforge antigo', quantidade:1, tamanho:2}]);
    assert.throws(() => sortearDadosNpc(original, {personalidade:'invalid'}), RangeError);
    assert.throws(() => sortearDadosNpc(original, {objetivo:'invalid'}), RangeError);
    assert.throws(() => sortearDadosNpc(original, {equipamento:'invalid'}), RangeError);
});

test('indicadores de carga ficam após tabela e armas, fora da coluna de itens', () => {
    const html = ler('views/pages/npcs.html');
    const css = ler('css/npc-jogador-integral.css');
    const i = html.indexOf('class="col inventario-itens"');
    const tabela = html.indexOf('class="tabela-itens-rolagem"', i);
    const fechamentoColuna = html.indexOf('</div>', html.indexOf('</table>', tabela));
    const resumo = html.indexOf('class="inventario-resumo"', tabela);
    assert.ok(i < tabela && fechamentoColuna < resumo);
    assert.match(css, /#npc-orig-inventario > \.inventario-resumo\s*\{\s*grid-column:\s*1\s*\/\s*-1/);
});

test('novos nomes da navegação mantêm os identificadores originais das páginas', () => {
    const html = ler('index.html');
    const nomes = {
        campanhas: 'Campanhas', diario:'Sessões', fichas:'Fichas', npcs:'NPCs',
        combate:'Combates', viagem:'Viagens', utilitarios:'Utilitários',
    };
    for (const [pagina, rotulo] of Object.entries(nomes)) {
        const expressao = new RegExp(`id="aba-${pagina}"[^>]*data-pagina="${pagina}"[^>]*><span class="cartucho-texto">${rotulo}</span>`);
        assert.match(html, expressao);
    }
});
