import { elemento, botao, porId } from '../../core/dom.js?v=mesa-34';
import { ARMAS, TRACOS } from '../ficha/campos.js?v=mesa-34';
import { rolarTraco } from '../rolagem.js?v=mesa-34';
import { imagemValida, inteiro, RETRATO_PADRAO as imagemPadrao } from './combatentes.js?v=mesa-34';
import { abrirSeletorCondicoes } from './condicoes.js?v=mesa-34';

function criarModelo(nome) {
    return porId(`modelo-combate-${nome}`).content.firstElementChild.cloneNode(true);
}

function secao(titulo) {
    const cartao = elemento('section', 'combate-cartao');
    if (titulo)
        cartao.append(elemento('h3', '', titulo));
    return cartao;
}

function identificacao(combatente, fotoNpc, recuperarRetrato, atualizarFila) {
    const topoIdentificacao = elemento('div', 'combate-identificacao-rolagem');
    const foto = secao('');
    foto.classList.add('combate-cartao-retrato');
    const retrato = elemento('img', 'combate-retrato');
    retrato.src = [combatente.imagem, fotoNpc].find(imagemValida) || imagemPadrao;
    retrato.alt = `Retrato de ${combatente.nome}`;
    retrato.addEventListener('error', () => {
        if (!retrato.src.endsWith(imagemPadrao))
            retrato.src = imagemPadrao;
    });
    if (combatente.tipo === 'jogador' && !imagemValida(combatente.imagem))
        void recuperarRetrato(combatente, retrato);
    const poster = elemento('div', 'combate-poster');
    const janela = elemento('div', 'combate-poster-foto');
    janela.append(retrato);
    poster.append(janela);
    foto.append(poster, elemento('strong', '', combatente.nome), elemento('p', '', combatente.responsavel));
    if (combatente.papel)
        foto.append(elemento('p', 'combate-personagem-funcao', combatente.papel));
    topoIdentificacao.append(foto);
    const ferimentos = secao('');
    ferimentos.classList.add('combate-cartao-ferimentos');
    const marcas = criarModelo('ferimentos');
    marcas.querySelectorAll('.check-caveira').forEach((campo, i) => {
        campo.checked = i < inteiro(combatente.ferimentos, 0, 3);
        campo.addEventListener('change', () => {
            const quantidade = [...marcas.querySelectorAll('.check-caveira')].filter(x => x.checked).length;
            combatente.ferimentos = quantidade;
            atualizarFila();
        });
    });
    ferimentos.append(marcas);
    topoIdentificacao.append(ferimentos);
    return topoIdentificacao;
}

function modificadores(combatente, salvar) {
    const modificadoresAtivos = secao('');
    modificadoresAtivos.classList.add('combate-vantagens-alinhadas');
    const linha = elemento('div', 'combate-modificadores');
    const total = elemento('strong', 'combate-modificadores-total');
    const atualizarTotal = () => {
        total.textContent = `Total: ${inteiro(combatente.vantagem, -3, 3) + inteiro(combatente.desvantagem, -3, 3)}`;
    };
    for (const [chave, rotulo] of [['vantagem', 'Vantagem'], ['desvantagem', 'Desvantagem']]) {
        const label = elemento('label', 'combate-modificador');
        label.append(elemento('span', '', rotulo));
        const input = elemento('input');
        input.type = 'number';
        input.min = '-3';
        input.max = '3';
        input.step = '1';
        input.value = combatente[chave] ?? 0;
        input.setAttribute('aria-label', rotulo);
        input.addEventListener('input', () => {
            combatente[chave] = inteiro(input.value, -3, 3);
            salvar();
            atualizarTotal();
        });
        const controles = elemento('div', 'combate-modificador-controles');
        const ajustar = passo => {
            combatente[chave] = inteiro(Number(input.value) + passo, -3, 3);
            input.value = combatente[chave];
            salvar();
            atualizarTotal();
        };
        controles.append(botao('−', () => ajustar(-1), 'municao-botao'), input, botao('+', () => ajustar(1), 'municao-botao'));
        label.append(controles);
        linha.append(label);
    }
    atualizarTotal();
    modificadoresAtivos.append(linha, total);
    return modificadoresAtivos;
}

function rolagemDeTraco(combatente) {
    const cartaoRolagem = secao('');
    cartaoRolagem.classList.add('combate-rolagem-compacta');
    const rolagem = criarModelo('rolagem');
    const seletorTraco = rolagem.querySelector('select');
    const seletorBonus = rolagem.querySelectorAll('select')[1];
    const resultado = rolagem.querySelector('output');
    for (const [indice, traco] of TRACOS.entries()) {
        const opcao = elemento('option', '', traco);
        opcao.value = `traco-${indice + 1}`;
        seletorTraco.append(opcao);
    }
    const botaoRolar = rolagem.querySelector('.botao-rolar');
    botaoRolar.addEventListener('click', () => {
        const indice = Number(seletorTraco.value.split('-')[1]) - 1;
        const traco = TRACOS[indice];
        if (!traco) {
            resultado.textContent = 'Selecione um traço';
            return;
        }
        const { soma } = rolarTraco(inteiro(combatente.tracos[traco], 0, 4));
        const bonus = inteiro(seletorBonus.value, -3, 3);
        resultado.textContent = `Resultado: ${soma + bonus} (dados ${soma}, modificador ${bonus})`;
    });
    cartaoRolagem.append(rolagem);
    return cartaoRolagem;
}

function arma(combatente, chaveArma, rotuloArma, salvar) {
    const dadosArma = combatente.armas[chaveArma] || (combatente.armas[chaveArma] = {
        nome: '',
        municao: 0,
        bonus: {}
    });
    const cartao = criarModelo('arma');
    cartao.querySelector('h3').textContent = `Arma ${rotuloArma.toLocaleLowerCase('pt-BR')}`;
    const nome = cartao.querySelector('.arma-nome input');
    nome.value = dadosArma.nome || '';
    nome.addEventListener('input', () => {
        dadosArma.nome = nome.value;
        salvar();
    });
    const municao = cartao.querySelector('.municao-valor');
    municao.value = inteiro(dadosArma.municao, 0, 99);
    const atualizar = () => {
        dadosArma.municao = inteiro(municao.value, 0, 99);
        municao.value = dadosArma.municao;
        salvar();
    };
    municao.addEventListener('change', atualizar);
    cartao.querySelectorAll('.municao-botao').forEach(controle => controle.addEventListener('click', () => {
        municao.value = inteiro(Number(municao.value) + Number(controle.dataset.direcao), 0, 99);
        atualizar();
    }));
    for (const input of cartao.querySelectorAll('[data-distancia]')) {
        const distancia = input.dataset.distancia;
        input.value = inteiro(dadosArma.bonus?.[distancia] ?? 0, -3, 3);
        input.addEventListener('change', () => {
            dadosArma.bonus ??= {};
            dadosArma.bonus[distancia] = inteiro(input.value, -3, 3);
            input.value = dadosArma.bonus[distancia];
            salvar();
        });
    }
    return cartao;
}

function condicoesAtivas(combatente, atualizar) {
    const cartaoCondicoes = secao('Condições');
    cartaoCondicoes.classList.add('combate-cartao-condicoes');
    const listaCondicoes = elemento('div', 'combate-condicoes-lista');
    const condCabecalho = cartaoCondicoes.querySelector('h3');
    const adicionarCond = botao('+ Adicionar condição', () => abrirSeletorCondicoes(condicao => {
        combatente.condicoes.push(condicao);
        atualizar();
    }), 'botao combate-adicionar-condicao');
    const barraCond = elemento('div', 'combate-condicoes-cabecalho');
    barraCond.append(condCabecalho, adicionarCond);
    cartaoCondicoes.prepend(barraCond);
    for (let i = 0; i < combatente.condicoes.length; i++) {
        const item = combatente.condicoes[i];
        const linha = elemento('div', 'combate-condicao');
        const cabecalhoItem = elemento('div', 'combate-condicao-topo');
        cabecalhoItem.append(elemento('strong', '', item.nome || 'Condição personalizada'), botao('×', () => {
            combatente.condicoes.splice(i, 1);
            atualizar();
        }, 'botao combate-remover-condicao'));
        const descricao = elemento('p', 'combate-condicao-descricao', item.efeito || 'Sem descrição definida');
        linha.append(cabecalhoItem, descricao);
        listaCondicoes.append(linha);
    }
    cartaoCondicoes.append(listaCondicoes);
    return cartaoCondicoes;
}

function acaoPreparada(combatente, salvar, aoAlternar) {
    const preparada = secao('');
    preparada.classList.add('combate-preparar-cartao');
    const cabecalho = elemento('div', 'combate-preparar-cabecalho');
    const titulo = elemento('h3', '', 'Preparar ações');
    const estrela = botao('', () => {
        combatente.preparada = combatente.preparada ? '' : ' ';
        aoAlternar();
    }, `combate-estrela ${combatente.preparada ? 'preparada' : ''}`);
    estrela.setAttribute('aria-label', combatente.preparada ? 'Remover ação preparada' : 'Criar ação preparada');
    estrela.title = combatente.preparada ? 'Remover ação preparada' : 'Criar ação preparada';
    cabecalho.append(titulo, estrela);
    preparada.append(cabecalho);
    const texto = elemento('textarea');
    texto.rows = 8;
    texto.value = (combatente.preparada || '').trim();
    texto.placeholder = 'Descreva a ação preparada';
    texto.setAttribute('aria-label', 'Descrição da ação preparada');
    texto.addEventListener('input', () => {
        combatente.preparada = texto.value || ' ';
        salvar();
    });
    preparada.append(texto);
    return preparada;
}

export function criarDetalhe(combatente, { fotoNpc, recuperarRetrato, salvar, atualizarFila, atualizarTudo }) {
    const grade = elemento('div', 'combate-colunas');
    const identidade = elemento('div', 'combate-coluna');
    identidade.append(identificacao(combatente, fotoNpc, recuperarRetrato, atualizarFila), modificadores(combatente, salvar));
    const arsenal = elemento('div', 'combate-coluna');
    arsenal.append(rolagemDeTraco(combatente));
    for (const [chave, rotulo] of ARMAS)
        arsenal.append(arma(combatente, chave, rotulo, salvar));
    const acoes = elemento('div', 'combate-coluna');
    acoes.append(condicoesAtivas(combatente, atualizarTudo), acaoPreparada(combatente, salvar, atualizarTudo));
    grade.append(identidade, arsenal, acoes);
    return grade;
}
