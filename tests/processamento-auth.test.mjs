import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comProcessamento, iniciarProcessamento } from '../js/core/processamento.js';

test('processamento encerra após sucesso e erro, mesmo sem DOM', async () => {
    assert.equal(await comProcessamento('Teste', async () => 42), 42);
    await assert.rejects(comProcessamento('Teste', async () => { throw Error('falha'); }), /falha/);
    const concluir = iniciarProcessamento('Teste');
    concluir(); concluir();
});
test('Mestre usa chave exclusiva de autenticação', () => {
    const fonte = readFileSync(new URL('../js/core/cliente.js', import.meta.url), 'utf8');
    assert.match(fonte, /storageKey: 'railroad-mestre-auth-v1'/);
});
