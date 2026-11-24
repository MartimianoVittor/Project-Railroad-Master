import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('coluna de mecânicas não depende de altura mínima fixa nem da medição do viewport por JavaScript', () => {
    const css = ler('css/utilitarios.css');
    const controlador = ler('js/controllers/utilitarios.js');
    assert.doesNotMatch(css, /height:clamp\(600px|height:var\(--util-altura-disponivel/);
    assert.doesNotMatch(controlador, /ajustarAlturaArea|agendarAlturaArea|--util-altura-disponivel/);
    assert.match(css, /#painel #pagina-utilitarios \.util-area-principal\s*\{[^}]*flex:\s*1 1 0;[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\);/s);
});

test('somente a lista de mecânicas rola dentro do catálogo, com cabeçalho fixo', () => {
    const css = ler('css/utilitarios.css');
    const template = ler('views/pages/utilitarios.html');
    assert.match(css, /#painel #pagina-utilitarios \.util-catalogo-topo\s*\{[^}]*flex:\s*0 0 auto;/s);
    assert.match(css, /#painel #pagina-utilitarios \.util-lista-mecanicas\s*\{[^}]*flex:\s*1 1 0;[^}]*overflow-y:\s*auto;/s);
    assert.match(template, /class="util-catalogo-topo"/);
    assert.match(template, /id="util-lista-mecanicas"/);
});


test('títulos de categoria acompanham a rolagem e não cobrem os cartões de mecânicas', () => {
    const css = ler('css/utilitarios.css');
    assert.match(css, /#pagina-utilitarios \.util-categoria-titulo\s*\{[^}]*position:\s*static;/s);
    assert.doesNotMatch(css, /#pagina-utilitarios \.util-categoria-titulo\s*\{[^}]*position:\s*sticky;/s);
    assert.doesNotMatch(css, /#pagina-utilitarios \.util-categoria-titulo\s*\{[^}]*top:\s*[-\d]+px;/s);
});

test('nova versão da folha de utilitários invalida o cache da publicação', () => {
    const html = ler('index.html');
    assert.match(html, /css\/utilitarios\.css\?v=mesa-\d+/);
});


test('lista de mecânicas reserva apenas uma margem curta depois do último cartão', () => {
    const css = ler('css/utilitarios.css');
    assert.match(css, /#painel #pagina-utilitarios \.util-lista-mecanicas\s*\{[^}]*padding:\s*10px 10px 8px;/s);
    assert.match(css, /#painel #pagina-utilitarios \.util-lista-mecanicas > \.util-mecanica:last-child\s*\{[^}]*margin-bottom:\s*0;/s);
    assert.doesNotMatch(css, /padding:\s*10px 10px 24px;/);
});

test('cartões de mecânica possuem parada de rolagem sem ocultar a borda inferior', () => {
    const css = ler('css/utilitarios.css');
    assert.match(css, /scroll-snap-type:\s*y proximity;/);
    assert.match(css, /#painel #pagina-utilitarios \.util-lista-mecanicas > \.util-mecanica\s*\{[^}]*scroll-snap-align:\s*end;/s);
});

test('área rolável termina antes da moldura inferior do catálogo', () => {
    const css = ler('css/utilitarios.css');
    const html = ler('index.html');
    // A proteção deve estar no CARTÃO, não no conteúdo rolável: o padding
    // da lista não impede que os itens em trânsito cubram a borda externa.
    assert.match(css, /#painel #pagina-utilitarios \.util-catalogo\s*\{[^}]*padding-bottom:\s*15px;/s);
    assert.match(css, /#painel #pagina-utilitarios \.util-lista-mecanicas\s*\{[^}]*overflow-y:\s*auto;/s);
    assert.match(html, /css\/utilitarios\.css\?v=mesa-\d+/);
});

 test('barra de rolagem tem recuo externo lateral para preservar a moldura', () => {
    assert.match(ler('css/utilitarios.css'), /\.util-catalogo > \.util-lista-mecanicas\s*\{[^}]*margin-inline:\s*10px;/s);
});
 test('rótulo de campanha vazia é curto no HTML e no controlador', () => {
    assert.match(ler('index.html'), /id="campanha-ativa">Nenhuma Selecionada</);
    assert.match(ler('js/controllers/campanhas.js'), /campanha\?\.nome \?\? 'Nenhuma Selecionada'/);
});
