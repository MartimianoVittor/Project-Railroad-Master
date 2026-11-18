import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRepositorioCampanhas } from '../js/services/campanhas.js';

const campanhaId = 'cbfbfb36-bce2-446b-91a9-de611c2b9e0b';
const jogadorId = 'f2a459c3-7559-4c06-b19c-2abb63683c34';
const envioId = '6319f275-76f2-4d1f-b891-4a9e1b6b5f28';
const fichaId = 'dd3867a3-87f2-4a1e-9582-9e4d2c2c53c0';
const fichaPrivada = '0b88b495-b724-4741-aae9-f080a67951b4';

function clienteSimulado() {
    const chamadas = [];
    const respostas = {
        criar_campanha_descrita_mestre: campanhaId,
        listar_campanhas_detalhadas_mestre: [{ campanha_id: campanhaId, nome: 'Sombras do Oeste', descricao: 'Uma jornada no deserto' }],
        listar_participantes_campanha_mestre: [{ jogador_id: jogadorId, jogador_nome: 'Joana', convite_status: 'aceito', envio_id: envioId, personagem_nome: 'O Pistoleiro', ficha_status: 'pendente' }],
        excluir_jogador_mesa_mestre: null,
        convidar_jogador_mesa: 'convite-1',
        listar_fichas_campanha_mestre: [{ envio_id: envioId, ficha_id: fichaId, status: 'pendente' }],
        decidir_ficha_campanha: null,
        remover_ficha_campanha: null,
        obter_ficha_para_mestre: { id: fichaId, titulo: 'O Pistoleiro', dados: { nome: 'Joana' } },
    };

    const cliente = {
        rpc: async (nome, parametros) => {
            chamadas.push({ tipo: 'rpc', nome, parametros });
            return { data: respostas[nome], error: null };
        },
        from: (tabela) => {
            assert.equal(tabela, 'fichas', 'Não deve consultar diretamente as tabelas de campanha');
            const consulta = { id: null };
            return {
                select(colunas) {
                    assert.match(colunas, /dados/);
                    chamadas.push({ tipo: 'select', tabela, colunas });
                    return this;
                },
                eq(chave, id) {
                    assert.equal(chave, 'id');
                    consulta.id = id;
                    return this;
                },
                async single() {
                    if (consulta.id === fichaPrivada) {
                        return { data: null, error: { message: 'Ficha não autorizada' } };
                    }
                    return { data: { id: fichaId, titulo: 'O Pistoleiro', dados: {} }, error: null };
                },
            };
        },
    };

    return { cliente, chamadas };
}

test('campanhas com descrição e participantes usam as RPCs da migração 005', async () => {
    const { cliente, chamadas } = clienteSimulado();
    const repositorio = criarRepositorioCampanhas(cliente);

    assert.equal(await repositorio.criarCampanha('Sombras do Oeste', 'Uma jornada no deserto'), campanhaId);
    assert.equal((await repositorio.listarCampanhas())[0].descricao, 'Uma jornada no deserto');
    assert.equal((await repositorio.listarParticipantes(campanhaId))[0].jogador_nome, 'Joana');
    await repositorio.convidarJogador(campanhaId, jogadorId);

    assert.deepEqual(chamadas, [
        { tipo: 'rpc', nome: 'criar_campanha_descrita_mestre', parametros: { p_nome: 'Sombras do Oeste', p_descricao: 'Uma jornada no deserto' } },
        { tipo: 'rpc', nome: 'listar_campanhas_detalhadas_mestre', parametros: undefined },
        { tipo: 'rpc', nome: 'listar_participantes_campanha_mestre', parametros: { p_campanha_id: campanhaId } },
        { tipo: 'rpc', nome: 'convidar_jogador_mesa', parametros: { p_campanha_id: campanhaId, p_jogador_id: jogadorId } },
    ]);
});

test('aprovar, recusar e retirar uma ficha não executam escrita direta na tabela fichas', async () => {
    const { cliente, chamadas } = clienteSimulado();
    const repositorio = criarRepositorioCampanhas(cliente);

    assert.equal((await repositorio.listarEnvios(campanhaId))[0].ficha_id, fichaId);
    await repositorio.decidirEnvio(envioId, true);
    await repositorio.decidirEnvio(envioId, false);
    await repositorio.removerEnvio(envioId);

    assert.deepEqual(chamadas, [
        { tipo: 'rpc', nome: 'listar_fichas_campanha_mestre', parametros: { p_campanha_id: campanhaId } },
        { tipo: 'rpc', nome: 'decidir_ficha_campanha', parametros: { p_envio_id: envioId, p_aprovar: true } },
        { tipo: 'rpc', nome: 'decidir_ficha_campanha', parametros: { p_envio_id: envioId, p_aprovar: false } },
        { tipo: 'rpc', nome: 'remover_ficha_campanha', parametros: { p_envio_id: envioId } },
    ]);
});

test('excluir jogador usa RPC autorizada sem apagar a ficha pessoal', async () => {
    const { cliente, chamadas } = clienteSimulado();
    const repositorio = criarRepositorioCampanhas(cliente);

    await repositorio.excluirJogador(campanhaId, jogadorId);
    assert.deepEqual(chamadas, [{
        tipo: 'rpc', nome: 'excluir_jogador_mesa_mestre',
        parametros: { p_campanha_id: campanhaId, p_jogador_id: jogadorId },
    }]);
});

test('o mestre consulta apenas a projeção autorizada pela RPC 006', async () => {
    const { cliente, chamadas } = clienteSimulado();
    const repositorio = criarRepositorioCampanhas(cliente);

    assert.equal((await repositorio.obterFicha(campanhaId, fichaId)).titulo, 'O Pistoleiro');
    assert.deepEqual(chamadas, [{
        tipo: 'rpc', nome: 'obter_ficha_para_mestre',
        parametros: { p_campanha_id: campanhaId, p_ficha_id: fichaId },
    }]);
    assert.ok(!chamadas.some((chamada) => chamada.tipo === 'select'),
        'o cliente do mestre não deve consultar diretamente public.fichas');
});

test('falhas de autorização da leitura da ficha são propagadas', async () => {
    const repositorio = criarRepositorioCampanhas({
        rpc: async () => ({ data: null, error: { message: 'Ficha não compartilhada' } }),
    });
    await assert.rejects(repositorio.obterFicha(campanhaId, fichaPrivada), /Ficha não compartilhada/);
});

test('erros de autorização e integridade provenientes do banco são propagados', async () => {
    const repositorio = criarRepositorioCampanhas({
        rpc: async () => ({ data: null, error: { message: 'Campanha de outra conta' } }),
    });
    await assert.rejects(repositorio.listarParticipantes(campanhaId), /Campanha de outra conta/);
});
