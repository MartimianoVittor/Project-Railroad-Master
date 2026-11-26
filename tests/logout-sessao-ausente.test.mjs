import test from 'node:test';
import assert from 'node:assert/strict';
import { ehSessaoAusente, iniciarAutenticacao, sairDaConta } from '../js/core/cliente.js';

const sessaoInexistente = () => Object.assign(new Error('Auth session missing!'), { name: 'AuthSessionMissingError' });
const sessaoValida = { user: { id: 'mestre-teste' }, access_token: 'token-ficticio' };

function cliente({ sessao = null, erroConsulta = null, erroSaida = null, rejeitarSaida = false } = {}) {
    let saidas = 0;
    return {
        auth: {
            async getSession() {
                if (erroConsulta instanceof Error && !('code' in erroConsulta)) throw erroConsulta;
                return { data: { session: sessao }, error: erroConsulta };
            },
            async signOut() {
                saidas++;
                if (rejeitarSaida) throw erroSaida;
                return { error: erroSaida };
            },
            onAuthStateChange() {},
        },
        totalSaidas: () => saidas,
    };
}

test('sessão inexistente: não chama signOut nem retorna erro', async () => {
    const sdk = cliente();
    await sairDaConta(sdk);
    assert.equal(sdk.totalSaidas(), 0);
});

test('sessão válida: encerra normalmente', async () => {
    const sdk = cliente({ sessao: sessaoValida });
    await sairDaConta(sdk);
    assert.equal(sdk.totalSaidas(), 1);
});

test('sessão ausente durante consulta é tratada como encerrada', async () => {
    const sdk = cliente({ erroConsulta: sessaoInexistente() });
    await sairDaConta(sdk);
    assert.equal(sdk.totalSaidas(), 0);
});

test('sessão ausente devolvida durante signOut não causa falha', async () => {
    const sdk = cliente({ sessao: sessaoValida, erroSaida: sessaoInexistente() });
    await sairDaConta(sdk);
    assert.equal(sdk.totalSaidas(), 1);
});

test('sessão ausente lançada durante signOut não causa falha', async () => {
    const sdk = cliente({ sessao: sessaoValida, erroSaida: sessaoInexistente(), rejeitarSaida: true });
    await sairDaConta(sdk);
    assert.equal(sdk.totalSaidas(), 1);
});

test('erro real de saída continua visível', async () => {
    const erro = Object.assign(new Error('Sem permissão'), { status: 403, name: 'AuthApiError' });
    await assert.rejects(sairDaConta(cliente({ sessao: sessaoValida, erroSaida: erro })), (atual) => atual === erro);
});

test('erro real de consulta continua visível', async () => {
    const erro = new Error('Falha de conexão');
    await assert.rejects(sairDaConta(cliente({ erroConsulta: erro })), (atual) => atual === erro);
});

test('inicialização com sessão ausente abre entrada sem erro', async () => {
    const chamadas = [];
    await iniciarAutenticacao(cliente({ erroConsulta: sessaoInexistente() }), (usuario) => chamadas.push(usuario));
    assert.deepEqual(chamadas, [null]);
});

test('identificação de sessão ausente não confunde outros erros HTTP', () => {
    assert.equal(ehSessaoAusente(sessaoInexistente()), true);
    assert.equal(ehSessaoAusente({ code: 'session_not_found' }), true);
    assert.equal(ehSessaoAusente({ name: 'AuthApiError', status: 403 }), false);
});

test('Mestre oculta painel após logout mesmo quando Supabase não emite SIGNED_OUT', async (t) => {
    const { iniciarSessao } = await import('../js/app/sessao.js');
    const { montarInterface } = await import('./apoio/interfaceSimulada.mjs');
    const porId = montarInterface(t);
    const estado = {
        versaoSessao: 0, versaoLista: 0, versaoCampanha: 0,
        navegacao: { abrir() {} },
    };
    const contexto = {
        estado, utilitarios: { atualizarContexto() {} }, diario: { carregarRascunho() {} },
        fichas: { listarEnvios() {} }, npcs: { carregarCampanha() {}, confirmarSaida: () => true },
        campanhas: {
            listarCampanhas() {}, listarParticipantes() {}, mostrarCampanha() {},
            mostrarFormularioConvite() {}, async atualizarCampanhas() {},
        },
    };
    let sessao = sessaoValida;
    const auth = {
        onAuthStateChange() { /* deliberadamente não envia SIGNED_OUT */ },
        async getSession() { return { data: { session: sessao } }; },
        async signOut() { sessao = null; return { error: null }; },
    };
    iniciarSessao(contexto, { atualizarSessao() {} }, { getItem: () => null }, async () => ({ auth }));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(estado.usuario?.id, 'mestre-teste');
    assert.equal(porId('painel').hidden, false);
    porId('sair').clicar();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(estado.usuario, null);
    assert.equal(porId('painel').hidden, true);
    assert.equal(porId('tela-entrada').hidden, false);
});
