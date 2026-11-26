import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSincronizadorEstadoMesa } from '../js/services/estadosMesa.js';
import { filtrarParticipantesDesvinculados } from '../js/modules/participantesMesa.js';

function preparar(estadoRemoto) {
    const estado = { usuario: { id: 'm' }, campanhaId: 'c', cliente: {}, modoLocal: false };
    const armazenamento = new Map();
    const enviados = [];
    let dados = { viagens: [
        { id: 'a', total: 100, grupos: [
            { id: 'g1', percorrido: 25, viajantes: [{ tipo: 'npc', ref: 'apagado' }, { tipo: 'npc', ref: 'ativo' }] },
            { id: 'g2', percorrido: 40, viajantes: [{ tipo: 'npc', ref: 'apagado' }] },
        ] },
        { id: 'b', total: 200, grupos: [{ id: 'g3', percorrido: 55, viajantes: [{ tipo: 'npc', ref: 'apagado' }] }] },
    ] };
    let conciliacoes = 0;
    const sincronizador = criarSincronizadorEstadoMesa({
        estado, tipo: 'viagens',
        ler: async () => estadoRemoto,
        gravar: async (_c, _tipo, documento, revisao) => { enviados.push(documento); return { revisao: revisao + 1 }; },
        obterDados: () => dados,
        aplicarDados: d => { dados = d; },
        temConteudo: d => Boolean(d?.viagens?.length),
        preservarLocal() {},
        armazenamento: () => ({
            getItem: k => armazenamento.get(k) ?? null,
            setItem: (k, v) => armazenamento.set(k, v),
            removeItem: k => armazenamento.delete(k),
        }),
        aoCarregar() {
            conciliacoes++;
            let houveMudanca = false;
            for (const viagem of dados.viagens) for (const grupo of viagem.grupos) {
                const resultado = filtrarParticipantesDesvinculados(grupo.viajantes, { npcs: new Set(['ativo']) });
                if (resultado.removidos.length) { grupo.viajantes = resultado.itens; houveMudanca = true; }
            }
            if (houveMudanca) sincronizador.agendar();
        },
    });
    return { sincronizador, estado, enviados, obter: () => dados, conciliacoes: () => conciliacoes };
}

const dormir = ms => new Promise(resolve => setTimeout(resolve, ms));

test('estado remoto antigo é reconciliado e as viagens/grupos mantêm progresso', async () => {
    const remoto = { revisao: 4, dados: preparar(null).obter() };
    const c = preparar(remoto);
    await c.sincronizador.ativar();
    assert.equal(c.conciliacoes(), 1);
    assert.deepEqual(c.obter().viagens.map(v => v.grupos.map(g => g.viajantes.map(p => p.ref))), [[['ativo'], []], [[]]]);
    assert.deepEqual(c.obter().viagens.map(v => v.grupos.map(g => g.percorrido)), [[25, 40], [55]]);
    await dormir(660);
    assert.equal(c.enviados.length, 1);
    assert.deepEqual(c.enviados[0].viagens[0].grupos[0].viajantes.map(p => p.ref), ['ativo']);
});

test('na primeira gravação sem estado remoto não reenvia participantes já removidos', async () => {
    const c = preparar(null);
    await c.sincronizador.ativar();
    await dormir(10);
    assert.equal(c.enviados.length, 1);
    assert.deepEqual(c.enviados[0].viagens[0].grupos[0].viajantes.map(p => p.ref), ['ativo']);
});
