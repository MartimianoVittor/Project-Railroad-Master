import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizarPreferencias } from '../js/modules/personalizacaoMestre.js';

const ler = caminho => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('preferências aceitam somente opções reconhecidas pelo kit', () => {
    const valores = normalizarPreferencias({
        botoes: 'cartucho-12', fundoPagina: 'ferrovia', fundoPrincipal: 'pergaminho',
        fundoInterno: 'couro', bordaPrincipal: 'hachurada', bordaInterna: 'filete',
    });
    assert.deepEqual(valores, {
        retratoJogador: 'estrela-de-xerife', retratoPersonagem: 'cartaz-de-procurado',
        botoes: 'cartucho-12', fundoPagina: 'ferrovia', fundoPrincipal: 'pergaminho',
        fundoInterno: 'couro', bordaPrincipal: 'ornamental', bordaInterna: 'filete',
    });
    assert.equal(normalizarPreferencias({fundoPagina:'javascript:alert(1)',bordaInterna:'inexistente'}).fundoPagina,'pergaminho');
    assert.equal(normalizarPreferencias({fundoPagina:'javascript:alert(1)',bordaInterna:'inexistente'}).bordaInterna,'latonada');
});

test('botão Conta abre oito categorias de personalização sem alterar funcionalidades existentes', () => {
    const html = ler('index.html');
    const conta = ler('js/modules/contaMestre.js');
    const modulo = ler('js/modules/personalizacaoMestre.js');
    assert.match(html, /id="conta-personalizar"[^>]*>Personalização/);
    assert.doesNotMatch(html, /Personalização \(em breve\)/);
    assert.match(conta, /personalizacao\.iniciar\(\)/);
    for (const chave of ['botoes','fundoPagina','fundoPrincipal','fundoInterno','bordaPrincipal','bordaInterna'])
        assert.match(modulo, new RegExp(chave));
    const dialogo = ler('views/dialogs/personalizacao.html');
    for (const nome of ['Salvar escolhas', 'Cancelar', 'Restaurar padrão']) assert.ok(dialogo.includes(nome));
});

test('kit contém todos os fundos, bordas e os dois botões originais', () => {
    const css = ['botoes', 'texturas', 'molduras'].map((nome) => {
        assert.ok(ler('css/kit-western.css').includes(`./tema/${nome}.css`));
        return ler(`css/tema/${nome}.css`);
    }).join('\n');
    for (const estilo of ['cartucho-12','faca-bowie']) assert.match(css,new RegExp(`rr-botao--${estilo}`));
    for (const estilo of ['pergaminho','tabua','couro','mapa-topografico','latao','terracota','ferrovia','jornal'])
        assert.match(css,new RegExp(`rr-fundo--${estilo}`));
    for (const estilo of ['latonada','cartaz','ornamental','ferro-rebitado','ferrovia','cantoneiras','costura','chanfrada','filete'])
        assert.match(css,new RegExp(`rr-borda--${estilo}`));
    const regras = ler('css/personalizacao.css');
    assert.match(regras, /\.rr-tema-borda-ativa/);
    assert.match(regras, /\.aba-navegacao\.aba-cartucho::before/);
});

test('retratos independentes usam os seis modelos compartilhados', () => {
    const css = ler('css/tema/retratos.css');
    for (const id of ['estrela-de-xerife','cartaz-de-procurado','camafeu-de-latao','moldura-de-latao','tambor-de-revolver','placa-de-ferrovia']) {
        assert.ok(css.includes(`.rr-retrato--${id} {`));
        assert.equal(normalizarPreferencias({retratoJogador:id}).retratoJogador,id);
        assert.equal(normalizarPreferencias({retratoPersonagem:id}).retratoPersonagem,id);
    }
});
