import test from 'node:test';
import assert from 'node:assert/strict';
import { criarParteFicha, nivelTraco } from '../js/modules/visualizarFicha.js';

class Elemento {
    constructor(tag) {
        this.tag = tag;
        this.children = [];
        this.textContent = '';
        this.className = '';
        this.attributes = {};
    }
    append(...itens) { this.children.push(...itens.flatMap((item) => item.tag === '#fragment' ? item.children : [item])); }
    setAttribute(nome, valor) { this.attributes[nome] = valor; }
}

globalThis.document = {
    createElement: (tag) => new Elemento(tag),
    createDocumentFragment: () => new Elemento('#fragment'),
};

function todoTexto(no) {
    return [no.textContent, ...no.children.map(todoTexto)].join(' ');
}

const ficha = {
    id: 'ficha-1', titulo: 'Pistoleiro',
    dados: {
        nome: 'Joana', apelido: 'Jô', bio: '<script>alert(1)</script>',
        desenhoCanvas: 'DADO_PRIVADO_CANVAS',
        itensQuadro: [{ texto: 'DADO_PRIVADO_QUADRO' }],
        personagem: {
            'nome-personagem': 'Calamidade',
            'profissao-personagem': 'Ferreiro',
            'bio-personagem': 'Viajante do oeste',
            marcadores: { 'traco-1': [true, true, false, false], ferimentos: [true, false, true] },
        },
        inventario: {
            rolagens: { 'arma-primaria': 'Colt', 'municao-primaria': '6', 'espaco-maximo-jogador': '20' },
            itens: [{ nome: 'Cantil', quantidade: 2, tamanho: 1, local: 'jogador', descricao: 'Água' }],
        },
    },
};

test('três partes usam a estrutura vertical e preservam o registro original', () => {
    const original = structuredClone(ficha);
    for (const parte of ['jogador', 'personagem', 'inventario']) {
        const coluna = criarParteFicha(ficha, parte);
        assert.equal(coluna.tag, 'article');
        assert.equal(coluna.children[0].tag, 'header');
        assert.equal(coluna.children[1].className, 'ficha-parte-corpo');
        assert.doesNotMatch(todoTexto(coluna), /DADO_PRIVADO_CANVAS|DADO_PRIVADO_QUADRO/);
    }
    assert.deepEqual(ficha, original, 'a consulta não modifica os dados do jogador');
});

test('jogador, personagem e inventário mostram suas informações corretas', () => {
    assert.match(todoTexto(criarParteFicha(ficha, 'jogador')), /Joana.*Jô.*<script>alert\(1\)<\/script>/);
    assert.match(todoTexto(criarParteFicha(ficha, 'personagem')), /Calamidade.*Ferreiro/);
    assert.match(todoTexto(criarParteFicha(ficha, 'personagem')), /Mira Afiada/);
    assert.match(todoTexto(criarParteFicha(ficha, 'personagem')), /TRAÇOS.*d4.*d6.*d8.*d12/);
    assert.match(todoTexto(criarParteFicha(ficha, 'inventario')), /Colt.*Munição.*6.*Cantil/);
    assert.equal(nivelTraco([true, true, false, false]), 2);
    assert.equal(nivelTraco([]), 0);
});

test('comparação identifica o personagem e o jogador em cada coluna', () => {
    const coluna = criarParteFicha(ficha, 'inventario', { comparacao: true });
    assert.equal(coluna.children[0].children[0].textContent, 'Calamidade');
    assert.equal(coluna.children[0].children[1].textContent, 'Joana');
    assert.throws(() => criarParteFicha(ficha, 'quadro'), /Parte de ficha desconhecida/);
});
