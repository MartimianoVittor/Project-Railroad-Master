import test from 'node:test';
import assert from 'node:assert/strict';
import { criarControladorDiario } from '../js/controllers/diario.js';
import { criarRepositorioSessoes } from '../js/services/sessoesLocal.js';
import { adiarResposta, montarInterface } from './apoio/interfaceSimulada.mjs';

function estadoDaMesa() {
    const memoria = new Map();
    return {
        usuario: { id: 'mestre' }, campanhaId: 'A', versaoSessao: 1, modoLocal: false,
        sessoesRepo: criarRepositorioSessoes({
            getItem: (chave) => memoria.get(chave),
            setItem: (chave, valor) => memoria.set(chave, valor),
        }),
        quadro: { coletar: () => ({}), restaurar() {}, habilitar() {} },
    };
}

const umaSessao = (nome) => ({ sessoes: [{ id: 's', nome, notas: '', quadro: {} }], ativaId: 's', salvoEm: null });

test('salvar em sequência preserva edições feitas enquanto a gravação anterior está em andamento', async (t) => {
    const porId = montarInterface(t);
    const estado = estadoDaMesa();
    const primeira = adiarResposta();
    const gravadas = [];
    const diario = criarControladorDiario({ estado }, {
        listar: async () => umaSessao('Travessia'),
        salvar: async (_campanha, dados) => {
            gravadas.push(dados.sessoes[0].notas);
            if (gravadas.length === 1) await primeira.resposta;
        },
    });
    await diario.carregarRascunho();
    porId('diario-anotacoes').value = 'Primeira nota';
    diario.marcarRascunhoAlterado();
    const primeiraGravacao = diario.salvarCampanhaAtual();
    await Promise.resolve();
    porId('diario-anotacoes').value = 'Nota mais recente';
    diario.marcarRascunhoAlterado();
    primeira.concluir();
    await primeiraGravacao;
    assert.equal(estado.rascunhoSujo, true);
    await diario.salvarCampanhaAtual();
    assert.deepEqual(gravadas, ['Primeira nota', 'Nota mais recente']);
    assert.equal(estado.rascunhoSujo, false);
    assert.equal(estado.sessoesRepo.carregar('mestre', 'A').sessoes[0].notas, 'Nota mais recente');
});

test('sair de A e voltar a A descarta a resposta da primeira abertura de A', async (t) => {
    const porId = montarInterface(t);
    const estado = estadoDaMesa();
    const primeira = adiarResposta();
    const respostas = [primeira.resposta, umaSessao('B'), umaSessao('A atual')];
    const diario = criarControladorDiario({ estado }, { listar: () => respostas.shift() });
    const antiga = diario.carregarRascunho();
    assert.equal(porId('adicionar-sessao').disabled, true);
    estado.campanhaId = 'B';
    await diario.carregarRascunho();
    estado.campanhaId = 'A';
    await diario.carregarRascunho();
    primeira.concluir(umaSessao('A antiga'));
    await antiga;
    assert.equal(estado.sessoes[0].nome, 'A atual');
    assert.equal(porId('adicionar-sessao').disabled, false);
});
