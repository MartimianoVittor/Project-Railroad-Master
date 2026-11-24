import { codigoUtilitarios } from './apoio/fontes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MECANICAS_POR_ID } from '../js/modules/catalogoRegras.js';
import { dadosTabela } from '../js/modules/tabelasConsultas.js';

const regra = (id) => MECANICAS_POR_ID.get(id);

test('tabelas mantêm todos os dados da fonte, com cabeçalhos coerentes', () => {
    for (const id of ['armas-perfis','viagem-distancias','catalogo-transportes','tabela-a','tabela-b']) {
        const tabela = dadosTabela(regra(id));
        assert.ok(tabela.linhas.length >= 5, `tabela ausente: ${id}`);
        for (const linha of tabela.linhas) assert.equal(linha.length,tabela.cabecalhos.length, id);
    }
});
test('tabelas de dados preservam os 12 resultados e nota de playtest', () => {
    for (const id of ['tabela-a','tabela-b']) {
        const tabela = dadosTabela(regra(id));
        assert.deepEqual(tabela.linhas.map((r)=>r[0]),Array.from({length:12},(_,i)=>String(i+1)));
    }
    assert.ok(dadosTabela(regra('tabela-b')).notas.some((n)=>n.includes('Propostas')));
});
test('descrições narrativas sem pares tabulares permanecem como notas', () => {
    const exemplo = dadosTabela({id:'exemplo',itens:['Ação pode ser cancelada ou interrompida']});
    assert.equal(exemplo.linhas.length,0);
    assert.deepEqual(exemplo.notas,['Ação pode ser cancelada ou interrompida']);
});
test('dois subtítulos removidos e corpo formatado com tabelas/justificação', () => {
    const html = readFileSync(new URL('../views/pages/utilitarios.html',import.meta.url),'utf8');
    const css = readFileSync(new URL('../css/utilitarios.css',import.meta.url),'utf8');
    const js = codigoUtilitarios();
    assert.doesNotMatch(html,/REFERÊNCIAS DO LIVRO|CONSULTAS PERSONALIZADAS/);
    assert.match(css,/text-align:justify/);
    assert.match(css,/util-tabela-regras/);
    assert.match(js,/dadosTabela\(regra\)/);
    assert.match(css,/grid-template-rows:\s*minmax\(0,\s*1fr\)/);
    assert.doesNotMatch(js,/--util-altura-disponivel|ajustarAlturaArea/);
});
