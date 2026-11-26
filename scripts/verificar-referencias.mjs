/**
 * Verifica recursos locais estáticos de HTML, CSS e importações ES.
 * Fragmentos HTML de views/ resolvem src/href contra index.html, não contra views/.
 * Classes, módulos e URLs montados dinamicamente requerem revisão separada.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../', import.meta.url)));
const erros = [];
let referencias = 0;

function arquivos(pasta, extensao) {
    return readdirSync(join(raiz, pasta), { withFileTypes: true }).flatMap((item) => {
        const relativo = join(pasta, item.name);
        return item.isDirectory() ? arquivos(relativo, extensao) :
            (item.name.endsWith(extensao) ? [relativo] : []);
    });
}
function verificar(origem, alvo, diretorioBase) {
    if (!alvo || /^(?:data:|https?:|blob:|\/\/|#|%23|var\(|\$\{)/i.test(alvo)) return;
    const limpo = alvo.split(/[?#]/)[0];
    if (!limpo || limpo.includes('${')) return;
    // O arquivo deve ficar dentro da árvore do repositório.
    const caminho = resolve(raiz, diretorioBase, limpo);
    referencias++;
    const rel = relative(raiz, caminho);
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel) || !existsSync(caminho)) {
        erros.push(`${origem}: recurso não encontrado: ${alvo}`);
    }
}

for (const arquivo of ['index.html', ...arquivos('views', '.html')]) {
    const conteudo = readFileSync(join(raiz, arquivo), 'utf8');
    // As views são injetadas no documento: seus caminhos são relativos à raiz.
    for (const m of conteudo.matchAll(/\b(?:src|href)\s*=\s*(['"])([^'"\s]+)\1/g)) {
        if (!/\.[a-z0-9]{2,6}(?:[?#]|$)/i.test(m[2])) continue;
        verificar(arquivo, m[2], '.');
    }
}
for (const arquivo of arquivos('css', '.css')) {
    const conteudo = readFileSync(join(raiz, arquivo), 'utf8');
    for (const m of conteudo.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
        verificar(arquivo, m[2], dirname(arquivo));
    }
}
for (const arquivo of arquivos('js', '.js')) {
    const conteudo = readFileSync(join(raiz, arquivo), 'utf8');
    for (const m of conteudo.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([./][^'"\s]+\.js(?:\?[^'"\s]+)?)\1/g)) {
        verificar(arquivo, m[2], dirname(arquivo));
    }
}

// Também evita o acúmulo de estilos antigos que deixaram de ser carregados.
// O índice é a raiz da árvore CSS; @imports são resolvidos em relação ao arquivo CSS.
const cssAtivos = new Set();
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const pilhaCss = [...html.matchAll(/\bhref\s*=\s*['"]([^'"\s]+\.css(?:\?[^'"\s]+)?)['"]/g)]
    .map(m => resolve(raiz, m[1].split('?')[0]));
while (pilhaCss.length) {
    const caminho = pilhaCss.pop();
    if (cssAtivos.has(caminho)) continue;
    cssAtivos.add(caminho);
    if (!existsSync(caminho)) continue; // A falha do caminho já foi registrada acima.
    const conteudo = readFileSync(caminho, 'utf8');
    for (const m of conteudo.matchAll(/@import\s+url\(\s*['"]?([^)'"\s]+\.css(?:\?[^)'"\s]+)?)/g)) {
        pilhaCss.push(resolve(dirname(caminho), m[1].split('?')[0]));
    }
}
for (const arquivo of arquivos('css', '.css')) {
    if (!cssAtivos.has(resolve(raiz, arquivo))) {
        erros.push(`${arquivo}: folha CSS sem referência na árvore de carregamento`);
    }
}

// Os módulos da aplicação são alcançáveis via js/mesa.js. O wrapper de sessões é
// uma exceção documentada: fornece a API anterior usada por testes/consumidores.
const jsAtivos = new Set();
const pilhaJs = [resolve(raiz, 'js/mesa.js')];
while (pilhaJs.length) {
    const caminho = pilhaJs.pop();
    if (jsAtivos.has(caminho)) continue;
    jsAtivos.add(caminho);
    if (!existsSync(caminho)) continue;
    const conteudo = readFileSync(caminho, 'utf8');
    for (const m of conteudo.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([./][^'"\s]+\.js(?:\?[^'"\s]+)?)\1/g)) {
        pilhaJs.push(resolve(dirname(caminho), m[2].split('?')[0]));
    }
}
const compatibilidade = new Set(['js/modules/sessoes.js']);
for (const arquivo of arquivos('js', '.js')) {
    if (!compatibilidade.has(arquivo.replaceAll('\\', '/')) && !jsAtivos.has(resolve(raiz, arquivo))) {
        erros.push(`${arquivo}: módulo JS sem referência na inicialização`);
    }
}
if (erros.length) {
    console.error(`Integridade de recursos: ${erros.length} referência(s) inválida(s):\n${erros.join('\n')}`);
    process.exitCode = 1;
} else {
    console.log(`Integridade de recursos: ${referencias} referências locais resolvidas, ${cssAtivos.size} CSS e ${jsAtivos.size} módulos JS alcançáveis.`);
}
