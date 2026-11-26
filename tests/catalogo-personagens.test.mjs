import test from 'node:test';
import assert from 'node:assert/strict';
import { atualizarCatalogoPersonagens } from '../js/services/catalogoPersonagens.js';

test('RPC dedicada exibe fichas aprovadas mesmo se consulta antiga falhar', async () => {
    const estado = { campanhaId: 'c', versaoSessao: 1, modoLocal: false, repositorio: {
        listarPersonagensAprovados: async () => [{ ficha_id: 'f1', personagem_nome: 'Rosa' }],
    }};
    await atualizarCatalogoPersonagens({ estado, campanhas: { atualizarConteudoCampanha: async () => { throw new Error('RPC antiga falhou'); } }});
    assert.equal(estado.personagensAprovados[0].ficha_id, 'f1');
});

test('consulta antiga mantém funcionalidade em bancos sem a migração 020', async () => {
    const estado = { campanhaId: 'c', versaoSessao: 1, modoLocal: false, repositorio: {
        listarPersonagensAprovados: async () => { throw new Error('PGRST202 function missing'); },
    }};
    await atualizarCatalogoPersonagens({ estado, campanhas: { atualizarConteudoCampanha: async () => {} }});
});

test('falha simultânea das RPCs é informada', async () => {
    const estado = { campanhaId: 'c', versaoSessao: 1, modoLocal: false, repositorio: {
        listarPersonagensAprovados: async () => { throw new Error('RPC ausente'); },
    }};
    await assert.rejects(() => atualizarCatalogoPersonagens({ estado, campanhas: {
        atualizarConteudoCampanha: async () => { throw new Error('não autorizada'); },
    }}), /não autorizada/);
});

test('não mistura pessoas quando campanha muda durante a consulta', async () => {
    const estado = { campanhaId: 'A', versaoSessao: 1, modoLocal: false, personagensAprovados: [], repositorio: {
        listarPersonagensAprovados: async () => { estado.campanhaId = 'B'; return [{ ficha_id: 'antiga' }]; },
    }};
    await atualizarCatalogoPersonagens({ estado, campanhas: { atualizarConteudoCampanha: async () => {} }});
    assert.deepEqual(estado.personagensAprovados, []);
});
