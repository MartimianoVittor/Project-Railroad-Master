import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSincronizadorEstadoMesa } from '../js/services/estadosMesa.js';

test('uma gravação pendente da campanha anterior não bloqueia a fila da nova campanha', async () => {
    const estado = { usuario: { id: 'mestre' }, campanhaId: 'a', cliente: {}, modoLocal: false };
    const armazenamento = new Map();
    const envios = [];
    let concluirPrimeira;
    const primeira = new Promise((resolve) => { concluirPrimeira = resolve; });
    const sincronizador = criarSincronizadorEstadoMesa({
        estado, tipo: 'viagens', ler: async () => null,
        obterDados: () => ({ nome: estado.campanhaId }), temConteudo: () => true,
        aplicarDados: () => assert.fail(), preservarLocal: () => {},
        armazenamento: () => ({
            getItem: (chave) => armazenamento.get(chave),
            setItem: (chave, valor) => armazenamento.set(chave, valor),
            removeItem: (chave) => armazenamento.delete(chave),
        }),
        gravar: async (campanha, tipo, dados, revisao) => {
            assert.equal(tipo, 'viagens');
            envios.push([campanha, dados.nome, revisao]);
            return campanha === 'a' ? primeira : { revisao: 1 };
        },
    });
    await sincronizador.ativar();
    estado.campanhaId = 'b';
    await sincronizador.ativar();
    concluirPrimeira({ revisao: 98 });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(envios, [['a', 'a', 0], ['b', 'b', 0]]);
    assert.equal(armazenamento.has('railroad-mestre:sync-pendente:viagens:mestre:b'), false);
});
