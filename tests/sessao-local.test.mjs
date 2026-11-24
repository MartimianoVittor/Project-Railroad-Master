import test from 'node:test';
import assert from 'node:assert/strict';
import { iniciarSessao } from '../js/app/sessao.js';
import { adiarResposta, montarInterface } from './apoio/interfaceSimulada.mjs';

test('uma conexão Google restaurada depois do clique em Usar local mantém o repositório local ativo', async (t) => {
    const porId = montarInterface(t);
    const sdk = adiarResposta();
    const estado = { versaoSessao: 0, versaoLista: 0, versaoCampanha: 0, navegacao: { abrir() {} } };
    const contexto = {
        estado, utilitarios: { atualizarContexto() {} }, diario: { carregarRascunho() {} },
        fichas: { listarEnvios() {} }, npcs: { carregarCampanha() {} },
        campanhas: {
            listarCampanhas() {}, listarParticipantes() {}, mostrarCampanha() {},
            mostrarFormularioConvite() {}, atualizarCampanhas() {},
        },
    };
    const locais = [{ campanha_id: 'antiga', nome: 'Campanha local' }];
    iniciarSessao(contexto, { atualizarSessao() {} }, { getItem: () => JSON.stringify(locais) }, () => sdk.resposta);
    porId('usar-local').clicar();
    await new Promise((resolve) => setImmediate(resolve));
    const repositorioLocal = estado.repositorio;
    const cliente = {
        auth: { onAuthStateChange() {}, getSession: async () => ({ data: { session: { user: { id: 'online' } } } }) },
        rpc: () => assert.fail('O modo local tentou usar o banco'),
    };
    sdk.concluir(cliente);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(estado.cliente, cliente);
    assert.equal(estado.repositorio, repositorioLocal);
    assert.deepEqual(await estado.repositorio.listarCampanhas(), locais);
    assert.equal(estado.usuario.id, 'mestre-local');
});
