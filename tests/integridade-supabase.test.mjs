import test from 'node:test';
import assert from 'node:assert/strict';
import { testarMigracaoLocal } from './apoio/migracoes-locais.mjs';
import { readFileSync } from 'node:fs';
import {
    salvarSessoesRemotas, listarSessoesRemotas, gravarNpcRemoto,
    gravarNpcsCombateRemoto, apagarNpcRemoto,
} from '../js/services/conteudoCampanha.js';
import { criarNpc } from '../js/modules/npcs.js';

const conectar = (rpc) => async () => ({ rpc });

test('Diário salva todas as sessões em uma RPC com revisão, sem atualizações parciais do cliente', async () => {
    const chamadas = [];
    const diario = { sessoes: [
        { id: '1', nome: 'A', notas: 'primeira', quadro: {} },
        { id: '2', nome: 'B', notas: 'segunda', quadro: {} },
    ], ativaId: '2' };
    const resultado = await salvarSessoesRemotas('campanha', diario, new Set(['1', 'removida']), 7,
        conectar(async (nome, parametros) => {
            chamadas.push({ nome, parametros });
            return { data: [{ revisao: 8 }], error: null };
        }));
    assert.equal(resultado, 8);
    assert.equal(chamadas.length, 1);
    assert.equal(chamadas[0].nome, 'salvar_diario_mestre');
    assert.deepEqual(chamadas[0].parametros, {
        p_campanha_id: 'campanha', p_sessoes: diario.sessoes,
        p_ativa_id: '2', p_ids_conhecidos: ['1', 'removida'], p_revisao: 7,
    });
});

test('falha da transação remota propaga erro sem executar tentativa parcial no navegador', async () => {
    let chamadas = 0;
    await assert.rejects(salvarSessoesRemotas('c', { sessoes: [], ativaId: null }, new Set(), 3,
        conectar(async () => {
            chamadas++;
            return { data: null, error: { message: 'conflito de revisão' } };
        })), /conflito/);
    assert.equal(chamadas, 1);
});

test('leitura do Diário usa uma única consulta consistente do servidor', async () => {
    const esperado = [{ id: 's', nome: 'Trilho' }];
    const dados = await listarSessoesRemotas('campanha', conectar(() => ({
        single: async () => ({ data: {
            sessoes: esperado, ativa_id: 's', revisao: 9, salvo_em: '2026-11-23T12:00:00Z',
        }, error: null }),
    })));
    assert.equal(dados.revisao, 9);
    assert.equal(dados.ativaId, 's');
    assert.deepEqual(dados.sessoes, esperado);
});

test('NPC individual exige revisão e não inclui metadados de revisão dentro do JSON', async () => {
    const npc = { ...criarNpc('completa'), id: 'npc-a', nome: 'Xerife', revisao: 4 };
    const chamadas = [];
    const nova = await gravarNpcRemoto('c', npc, conectar(async (nome, params) => {
        chamadas.push([nome, params]);
        return { data: [{ revisao: 5 }], error: null };
    }));
    assert.equal(nova, 5);
    assert.equal(chamadas[0][0], 'salvar_npc_mestre');
    assert.equal(chamadas[0][1].p_revisao, 4);
    assert.equal('revisao' in chamadas[0][1].p_dados, false);
    assert.equal(npc.revisao, 4);
});

test('encerramento de combate atualiza os NPCs em uma só operação', async () => {
    const npcs = [
        { ...criarNpc('completa'), id: 'a', nome: 'A', revisao: 2 },
        { ...criarNpc('completa'), id: 'b', nome: 'B', revisao: 5 },
    ];
    const chamadas = [];
    const confirmado = await gravarNpcsCombateRemoto('c', npcs, conectar(async (nome, params) => {
        chamadas.push({ nome, params });
        return { data: [{ id: 'a', revisao: 3 }, { id: 'b', revisao: 6 }], error: null };
    }));
    assert.equal(chamadas.length, 1);
    assert.equal(chamadas[0].nome, 'salvar_npcs_combate_mestre');
    assert.deepEqual(chamadas[0].params.p_npcs.map((n) => n.revisao), [2, 5]);
    assert.deepEqual(confirmado, [{ id: 'a', revisao: 3 }, { id: 'b', revisao: 6 }]);
});

test('exclusão de NPC usa RPC com revisão e rejeita conflito', async () => {
    const chamadas = [];
    await assert.rejects(apagarNpcRemoto('c', 'npc', 3, conectar(async (nome, parametros) => {
        chamadas.push({ nome, parametros });
        return { data: null, error: { message: 'Conflito: NPC alterado' } };
    })), /Conflito/);
    assert.deepEqual(chamadas, [{ nome: 'excluir_npc_mestre', parametros: {
        p_campanha_id: 'c', p_npc_id: 'npc', p_revisao: 3,
    } }]);
    await apagarNpcRemoto('c', 'npc', 3, conectar(async () => ({ data: true, error: null })));
});

testarMigracaoLocal('migração 015 revoga escrita direta e exige RPC para exclusão',
    ['015_gravacoes_protegidas_mestre.sql'], () => {
    const sql = readFileSync(new URL('../supabase/015_gravacoes_protegidas_mestre.sql', import.meta.url), 'utf8');
    for (const tabela of ['npcs', 'sessoes', 'estados_mestre', 'diarios_mestre']) {
        assert.match(sql, new RegExp(`REVOKE INSERT, UPDATE, DELETE ON public\.${tabela} FROM authenticated`, 'i'));
    }
    assert.match(sql, /FUNCTION public\.excluir_npc_mestre\(/);
    assert.match(sql, /mestre_possui_campanha/);
});

testarMigracaoLocal('migração exige autorização, atomicidade, limites e revisões otimististas',
    ['012_integridade_conteudo_mestre.sql'], () => {
    const sql = readFileSync(new URL('../supabase/012_integridade_conteudo_mestre.sql', import.meta.url), 'utf8');
    for (const nome of ['ler_diario_mestre', 'salvar_diario_mestre', 'salvar_npc_mestre', 'salvar_npcs_combate_mestre']) {
        assert.match(sql, new RegExp(`FUNCTION public\\.${nome}\\(`));
    }
    assert.match(sql, /BEGIN;[\s\S]*COMMIT;/);
    assert.match(sql, /p_revisao = 0/);
    assert.match(sql, /AND d\.revisao = p_revisao/);
    assert.match(sql, /AND n\.revisao = v_revisao/);
    assert.match(sql, /railroad_private\.mestre_possui_campanha/);
    assert.match(sql, /SECURITY INVOKER/);
});
