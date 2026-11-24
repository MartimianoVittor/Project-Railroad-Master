import { codigoUtilitarios } from './apoio/fontes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MECANICAS, CATEGORIAS_REGRAS, CONSULTAS_PADRAO } from '../js/modules/catalogoRegras.js';
import { encaixarCartoes, colunasDaGrade, passoPar, passoInteiro } from '../js/modules/gradeConsultas.js';
const ler = (caminho) => readFileSync(new URL(`../${caminho}`,import.meta.url),'utf8');

test('catálogo registra regras, páginas e IDs sem repetição',()=>{
  assert.ok(MECANICAS.length >= 70);
  assert.equal(new Set(MECANICAS.map((m)=>m.id)).size, MECANICAS.length);
  for (const m of MECANICAS) {
    assert.ok(CATEGORIAS_REGRAS.includes(m.categoria));
    assert.ok(m.titulo && m.resumo && m.pagina);
    assert.ok(/^\d/.test(m.pagina));
  }
  for (const consulta of CONSULTAS_PADRAO) {
    assert.ok(consulta.itens.length > 3);
    for (const id of consulta.itens) assert.ok(MECANICAS.some((m)=>m.id === id));
  }
});

test('grade encaixa cartões de tamanhos diferentes sem sobreposição',()=>{
  const entrada = Array.from({length:32},(_,i)=>({id:`m${i}`,x:i%3,y:(i*7)%21,w:2+(i%3),h:5+(i%5)}));
  for(const colunas of [4,6,12,18,24]) {
    const posicionados = encaixarCartoes(entrada,colunas,'m11');
    const ocupadas = new Set();
    for(const p of posicionados) {
      assert.ok(p.x >= 0 && p.x+p.w <= colunas && p.y >= 0);
      assert.equal(p.w,Math.trunc(p.w));assert.equal(p.h,Math.trunc(p.h));
      for(let y=p.y;y<p.y+p.h;y++) for(let x=p.x;x<p.x+p.w;x++) {
        const chave=`${x}:${y}`;assert.ok(!ocupadas.has(chave),`sobreposição: ${chave}`);ocupadas.add(chave);
      }
    }
  }
});

test('redimensionamento por largura mantém organização do grid',()=>{
  assert.deepEqual([300,510,740,1120].map(colunasDaGrade),[10,18,28,42]);
  const a=encaixarCartoes([{id:'x',x:6,y:1,w:3,h:9},{id:'y',x:0,y:0,w:2,h:7}],4,'x');
  assert.equal(a.find((p)=>p.id==='x').x,0);
  assert.equal(a.find((p)=>p.id==='x').w,4);
});

test('Utilitários mantém as páginas do Mestre e separa CSS e controlador',()=>{
  const index=ler('index.html'), mesa=ler('js/mesa.js');
  assert.match(index,/css\/botoes-railroad\.css/);
  assert.match(index,/css\/utilitarios\.css/);
  assert.match(mesa,/criarControladorUtilitarios/);
  assert.match(mesa,/contexto\.utilitarios\.iniciarEventos\(\)/);
  assert.match(mesa,/pagina === 'utilitarios'/);
  const pagina=ler('views/pages/utilitarios.html');
  for(const id of ['util-consulta-salva','util-salvar','util-limpar','util-excluir','util-busca','util-lista-mecanicas','util-grade']) assert.match(pagina,new RegExp(`id="${id}"`));
});

test('tamanhos manuais ímpares são preservados no encaixe', () => {
  assert.equal(passoPar(3),4);
  assert.equal(passoPar(9),10);
  assert.equal(passoPar(15,2,8),8);
  for (const n of [2,3,4,5,11,20]) assert.equal(passoPar(n)%2,0);
  const antigo = encaixarCartoes([{id:'antigo',w:3,h:9,x:0,y:0}],8)[0];
  assert.deepEqual([antigo.w,antigo.h],[4,9]);
  assert.equal(passoInteiro(5),5);
  assert.equal(passoInteiro(7,2,6),6);
  const carta = encaixarCartoes([{id:'c', w:7, h:5, x:0, y:0}], 12)[0];
  assert.deepEqual([carta.w,carta.h],[7,5]);
});

test('catálogo exibe dimensões e não exibe contador total',()=>{
 const html=ler('views/pages/utilitarios.html');
 const codigo=codigoUtilitarios();
 const css=ler('css/utilitarios.css');
 assert.doesNotMatch(html,/id="util-total-catalogo"/);
 assert.match(codigo,/util-mecanica-tamanho/);
 assert.match(css,/grid-auto-rows:var\(--util-celula\)/);
 assert.match(codigo,/tamanhoPreferido/);
});

test('nova grade divide a largura em células menores, sempre com colunas pares', () => {
  for (const largura of [180,240,320,380,600,800,1080,1400]) {
    const cols = colunasDaGrade(largura);
    assert.ok(cols >= 4 && cols <= 48);
    assert.equal(cols % 2, 0);
    assert.ok(cols > 8 || largura < 500, `poucas colunas para ${largura}`);
  }
  const colocados = encaixarCartoes([{id:'a',w:16,h:4},{id:'b',w:6,h:8}],20);
  assert.deepEqual(colocados.map(({w,h}) => [w,h]),[[16,4],[6,8]]);
});

test('atualização 48 recalcula alturas automáticas antigas e mantém apenas ajustes explícitos',()=>{
  const js=codigoUtilitarios();
  const css=ler('css/utilitarios.css');
  const campanha=ler('js/controllers/campanhas.js');
  assert.match(js,/ajusteManual: p\.ajusteManual === true/);
  assert.match(js,/if \(!peca\.ajusteManual\)/);
  assert.match(js,/atual\.ajusteManual = true/);
  assert.match(js,/criar\('button', 'util-cartao-arrastar', '⠿'\)/);
  assert.match(css,/\.util-cartao-rodape \{ flex-wrap:nowrap/);
  assert.match(campanha,/instrucao\.hidden = estado\.campanhas\.length > 0/);
  assert.doesNotMatch(campanha, /\? 'Selecione uma campanha'/);
});


test('a grade nunca aceita cartão com lado inferior a quatro células', () => {
  const cartoes = encaixarCartoes([
    { id:'antigo1', x:0, y:0, w:1, h:2 },
    { id:'antigo2', x:3, y:0, w:3, h:3 },
    { id:'valido', x:0, y:5, w:7, h:5 },
  ], 12);
  for (const p of cartoes) {
    assert.ok(p.w >= 4 && p.h >= 4, `${p.id} pode ficar menor que 4×4`);
    assert.ok(p.x + p.w <= 12, `${p.id} saiu da largura do quadro`);
  }
  assert.deepEqual(cartoes.find((p) => p.id === 'valido') &&
    [cartoes.find((p) => p.id === 'valido').w, cartoes.find((p) => p.id === 'valido').h], [7, 5]);
});

test('redimensionamento respeita bordas da grade sem deslocar a origem', () => {
  const codigo = codigoUtilitarios();
  assert.match(codigo, /const maximoLargura = Math.max\(MIN_LADO_CARTAO, colunas - base.x\)/);
  assert.match(codigo, /linhasVisiveisAbaixo\(base\)/);
  assert.match(codigo, /const maximoAltura = Math.max\(pos.h, linhasVisiveisAbaixo\(pos\)\)/);
  assert.match(codigo, /atual.x = pos.x/);
  assert.doesNotMatch(codigo, /atual.x = Math.min\(pos.x, colunas - largura\)/);
});
