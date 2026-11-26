/** Confere a sintaxe de todos os módulos JavaScript sem executar código do navegador. */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
function arquivos(pasta) {
    return readdirSync(join(raiz, pasta), { withFileTypes: true }).flatMap(item => {
        const relativo = join(pasta, item.name);
        return item.isDirectory() ? arquivos(relativo) :
            (/\.(?:js|mjs)$/.test(item.name) ? [relativo] : []);
    });
}
const modulos = [...arquivos('js'), ...arquivos('scripts')];
let problemas = 0;
for (const modulo of modulos) {
    const resultado = spawnSync(process.execPath, ['--check', join(raiz, modulo)], { encoding: 'utf8' });
    if (resultado.status === 0) continue;
    console.error(`Erro de sintaxe em ${modulo}:\n${resultado.stderr || resultado.stdout}`);
    problemas++;
}
console.log(`Sintaxe: ${modulos.length - problemas}/${modulos.length} módulos válidos.`);
if (problemas) process.exitCode = 1;
