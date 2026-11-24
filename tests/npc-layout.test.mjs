import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (arquivo) => readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
const css = ler('css/npc-jogador-integral.css');
const html = ler('views/pages/npcs.html');

test('campos longos de NPC têm altura estável e rolagem própria', () => {
    const regra = css.match(/\.pagina-npcs \.npc-form-reiniciado \.campos-form-npc textarea\s*\{([^}]+)\}/)?.[1];
    assert.ok(regra, 'Regra específica de textarea do editor ausente');
    assert.match(regra, /height:\s*100px\s*;/);
    assert.match(regra, /min-height:\s*100px\s*;/);
    assert.match(regra, /max-height:\s*100px\s*;/);
    assert.match(regra, /resize:\s*none\s*;/);
    assert.match(regra, /overflow-y:\s*auto\s*;/);
    assert.match(html, /id="npc-orig-notas"[^>]*rows="4"/);
    assert.match(html, /id="npc-orig-bio-personagem"[^>]*rows="4"/);
});

test('tabela de itens usa área flexível sem expandir indefinidamente', () => {
    const tabela = css.match(/\.pagina-npcs \.npc-form-reiniciado #npc-orig-inventario \.tabela-itens-rolagem\s*\{([^}]+)\}/)?.[1];
    const coluna = css.match(/\.pagina-npcs \.npc-form-reiniciado #npc-orig-inventario > \.inventario-itens\s*\{([^}]+)\}/)?.[1];
    assert.ok(tabela && coluna);
    assert.match(tabela, /flex:\s*1 1 auto/);
    assert.match(tabela, /max-height:\s*390px/); // preservado apenas para telas estreitas
    assert.match(tabela, /overflow:\s*auto/);
    assert.match(tabela, /background:\s*var\(--rr-leitura-painel/);
    assert.match(coluna, /scrollbar-gutter:\s*auto/);
    assert.match(coluna, /padding-right:\s*0/);
});

test('ficha delega o scroll horizontal à tabela e mantém resumo abaixo das colunas', () => {
    const campos = Array.from(css.matchAll(/\.pagina-npcs \.npc-form-reiniciado \.campos-form-npc\s*\{([^}]+)\}/g)).at(-1)?.[1];
    assert.ok(campos);
    assert.match(campos, /overflow-x:\s*hidden/);
    assert.match(campos, /scrollbar-gutter:\s*auto/);
    assert.match(css, /#npc-orig-inventario > \.inventario-resumo\s*\{\s*grid-column:\s*1\s*\/\s*-1/);
});

test('desktop: tabela ocupa a altura da coluna de armas sem teto de 390px', () => {
    const desktop = css.match(/@media \(min-width: 1001px\) \{\s*\.pagina-npcs \.npc-form-reiniciado #npc-orig-inventario > \.inventario-itens([\s\S]*?)\n\}/)?.[0];
    assert.ok(desktop, 'Ajuste desktop de inventário ausente');
    assert.match(desktop, /\.tabela-itens-rolagem\s*\{[^}]*flex:\s*1 1 0/);
    assert.match(desktop, /\.tabela-itens-rolagem\s*\{[^}]*max-height:\s*none/);
    assert.match(desktop, /\.tabela-itens-rolagem\s*\{[^}]*min-height:\s*0/);
});

test('HTML carrega a versão corrigida do layout do inventário', () => {
    assert.match(ler('index.html'), /css\/npc-jogador-integral\.css\?v=mesa-\d+/);
});
