import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('HTML, CSS e importações estáticas apontam para recursos existentes', () => {
    const script = fileURLToPath(new URL('../scripts/verificar-referencias.mjs', import.meta.url));
    const resposta = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    assert.equal(resposta.status, 0, resposta.stderr || resposta.stdout);
});
