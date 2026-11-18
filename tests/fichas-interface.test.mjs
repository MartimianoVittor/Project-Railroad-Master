import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');

test('seletor à esquerda e três modos de comparação à direita', () => {
    const html = ler('views/pages/fichas.html');
    assert.ok(html.indexOf('id="seletor-personagem"') < html.indexOf('class="modos-consulta-fichas"'));
    for (const parte of ['jogador', 'personagem', 'inventario']) {
        assert.match(html, new RegExp(`data-comparar-ficha="${parte}"`));
    }
    assert.match(html, /id="quadro-fichas"/);
    assert.match(html, /id="conteudo-fichas"/);
    assert.doesNotMatch(html, /json-ficha|lista-envios|ficha-detalhes|quadro-de-ideias/);
});

test('o excesso fica no quadro e nas colunas, sem aumentar a página', () => {
    const css = ler('css/fichas.css');
    assert.match(css, /\.conteudo-fichas\s*\{[^}]*overflow-x: auto/s);
    assert.match(css, /\.ficha-parte-corpo\s*\{[^}]*overflow: auto/s);
    assert.match(css, /\.conteudo-fichas\.modo-completo \.ficha-parte\s*\{[^}]*calc\(\(100% - 1\.5rem\) \/ 3\)/s);
    assert.match(css, /\.quadro-fichas\s*\{[^}]*overflow: hidden/s);
});

test('SQL 006 impede a leitura integral da ficha e não expõe o quadro de ideias', () => {
    const sql = ler('supabase/006_fichas_leitura_privada.sql');
    assert.match(sql, /drop policy if exists fichas_ler_em_campanhas/);
    assert.match(sql, /campanha\.mestre_id = \(select auth\.uid\(\)\)/);
    assert.match(sql, /convite\.status = 'aceito'/);
    assert.match(sql, /envio\.status in \('pendente', 'aprovada'\)/);
    assert.match(sql, /jsonb_build_object\(/);
    assert.doesNotMatch(sql, /'desenhoCanvas'\s*,|'itensQuadro'\s*,/);
    assert.doesNotMatch(ler('js/services/campanhas.js'), /\.from\('fichas'\)/);
});
