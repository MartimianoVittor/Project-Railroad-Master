import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSincronizadorEstadoMesa } from '../js/services/estadosMesa.js';

function criarCenario({ remota = () => null, gravar } = {}) {
    const armazenamento = new Map();
    const estado = { usuario: { id: 'mestre' }, campanhaId: 'campanha', modoLocal: false, cliente: {} };
    let dados = { viagens: [{ id: 'primeira' }] };
    const mensagens = [];
    const bloqueios = [];
    const enviar = [];
    const sincronizador = criarSincronizadorEstadoMesa({
        estado, tipo: 'viagens',
        ler: async () => remota(),
        gravar: async (...args) => {
            enviar.push(args);
            return gravar ? gravar(...args) : { revisao: args[3] + 1 };
        },
        obterDados: () => dados,
        aplicarDados: (valor) => { dados = valor; },
        temConteudo: (valor) => Boolean(valor?.viagens?.length),
        preservarLocal() {},
        avisar: (msg) => mensagens.push(msg),
        confirmar: () => false,
        aoBloqueio: (status) => bloqueios.push(status),
        armazenamento: () => ({
            getItem: (chave) => armazenamento.get(chave) ?? null,
            setItem: (chave, valor) => armazenamento.set(chave, valor),
            removeItem: (chave) => armazenamento.delete(chave),
        }),
    });
    return { sincronizador, mensagens, bloqueios, enviar, armazenamento,
        mudar(novo) { dados = novo; sincronizador.agendar(); },
    };
}
const pendencia = 'railroad-mestre:sync-pendente:viagens:mestre:campanha';
const passo = () => new Promise((resolve) => setTimeout(resolve, 15));

test('depois de falha de rede, tentar novamente envia a cópia local mais recente', async () => {
    let falha = true;
    const c = criarCenario({ gravar: async (_campanha, _tipo, _dados, revisao) => {
        if (falha) throw Error('Sem internet');
        return { revisao: revisao + 1 };
    } });
    await c.sincronizador.ativar();
    await passo();
    assert.equal(c.armazenamento.get(pendencia), '1');
    assert.equal(c.bloqueios.at(-1), true);
    c.mudar({ viagens: [{ id: 'nova-versao' }] });
    falha = false;
    assert.equal(await c.sincronizador.tentarNovamente(), true);
    assert.equal(c.enviar.at(-1)[2].viagens[0].id, 'nova-versao');
    assert.equal(c.armazenamento.has(pendencia), false);
    assert.equal(c.bloqueios.at(-1), false);
});

test('se a revisão remota mudou, o retry recusa sobrescrita e conserva a pendência', async () => {
    let remota = null;
    const c = criarCenario({
        remota: () => remota,
        gravar: async () => { throw Error('Erro temporário'); },
    });
    await c.sincronizador.ativar();
    await passo();
    remota = { revisao: 2, dados: { viagens: [{ id: 'outra-aba' }] } };
    assert.equal(await c.sincronizador.tentarNovamente(), false);
    assert.equal(c.enviar.length, 1);
    assert.equal(c.armazenamento.get(pendencia), '1');
    assert.match(c.mensagens.at(-1), /Conflito/);
});

test('alterações realizadas durante a gravação não são descartadas pela resposta antiga', async () => {
    let liberar;
    const primeira = new Promise((resolver) => { liberar = resolver; });
    let chamadas = 0;
    const c = criarCenario({ gravar: async (_campanha, _tipo, _dados, revisao) => {
        chamadas++;
        if (chamadas === 1) await primeira;
        return { revisao: revisao + 1 };
    } });
    await c.sincronizador.ativar();
    await passo();
    c.mudar({ viagens: [{ id: 'mais-recente' }] });
    liberar();
    await passo();
    assert.equal(c.enviar.length, 2);
    assert.equal(c.enviar[0][2].viagens[0].id, 'primeira');
    assert.equal(c.enviar[1][2].viagens[0].id, 'mais-recente');
    assert.equal(c.enviar[1][3], 1);
    assert.equal(c.armazenamento.has(pendencia), false);
});
