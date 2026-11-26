import { elemento as criar } from '../../core/dom.js?v=mesa-44';
import { dadosTabela } from '../tabelasConsultas.js?v=mesa-44';

function botaoAjuste(acao, simbolo, titulo, id) {
    const botao = criar('button', acao === 'remover' ? 'util-remover' : '', simbolo);
    botao.type = 'button';
    botao.title = titulo;
    botao.setAttribute('aria-label', titulo);
    botao.dataset.acao = acao;
    botao.dataset.cartao = id;
    return botao;
}
export function montarCartao(pos, regra) {
    const article = criar('article', 'util-cartao');
    article.dataset.id = pos.id;
    if (pos.ajusteManual) article.classList.add('util-tamanho-manual');
    article.style.gridColumn = `${pos.x + 1} / span ${pos.w}`;
    article.style.gridRow = `${pos.y + 1} / span ${pos.h}`;
    const cabecalho = criar('div', 'util-cartao-cabecalho');
    cabecalho.append(criar('h4', '', regra.titulo));
    const arrastar = criar('button', 'util-cartao-arrastar', '⠿');
    arrastar.type = 'button';
    arrastar.dataset.arrastar = pos.id;
    arrastar.title = `Arrastar ${regra.titulo} para outra posição na grade`;
    arrastar.setAttribute('aria-label', arrastar.title);
    arrastar.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight');
    // O X fica ao lado esquerdo do botão de arraste, no alto do cartão.
    cabecalho.append(botaoAjuste('remover', '×', `Remover ${regra.titulo} do quadro`, pos.id), arrastar);
    const corpo = criar('div', 'util-cartao-corpo');
    corpo.append(criar('p', '', regra.resumo));
    const dados = dadosTabela(regra);
    if (dados.linhas.length) {
        const contorno = criar('div', 'util-tabela-rolagem');
        const tabela = criar('table', 'util-tabela-regras');
        const legenda = criar('caption', 'sr-only', `Referências de ${regra.titulo}`);
        const cabecalhoTabela = criar('thead');
        const primeiraLinha = criar('tr');
        for (const coluna of dados.cabecalhos) {
            const celula = criar('th', '', coluna);
            celula.scope = 'col';
            primeiraLinha.append(celula);
        }
        cabecalhoTabela.append(primeiraLinha);
        const linhasTabela = criar('tbody');
        for (const linha of dados.linhas) {
            const tr = criar('tr');
            for (const valor of linha) tr.append(criar('td', '', valor));
            linhasTabela.append(tr);
        }
        tabela.append(legenda, cabecalhoTabela, linhasTabela);
        contorno.append(tabela);
        corpo.append(contorno);
    }
    if (dados.notas.length) {
        const lista = criar('ul');
        dados.notas.forEach((it) => lista.append(criar('li', '', it)));
        corpo.append(lista);
    }
    const rodape = criar('div', 'util-cartao-rodape');
    const pagina = criar('span', 'util-pagina-livro', `p. ${regra.pagina}`);
    pagina.title = `Railroad — Livro de Regras 1.0, página ${regra.pagina}`;
    rodape.append(pagina);
    article.append(cabecalho,corpo,rodape);
    // Alças de borda substituem os quatro botões de tamanho: lateral
    // direita (largura), inferior (altura) e canto (ambas as dimensões).
    for (const [lado, titulo, orientacao] of [
        ['largura', 'Arrastar para ajustar a largura', 'vertical'],
        ['altura', 'Arrastar para ajustar a altura', 'horizontal'],
        ['ambos', 'Arrastar o canto para ajustar largura e altura', 'horizontal'],
    ]) {
        const alca = criar('span', `util-alca util-alca-${lado}`);
        alca.dataset.redimensionar = lado;
        alca.dataset.cartao = pos.id;
        alca.tabIndex = 0;
        alca.setAttribute('role', 'separator');
        alca.setAttribute('aria-orientation', orientacao);
        alca.setAttribute('aria-label', `${titulo} de ${regra.titulo}; use as setas do teclado`);
        alca.title = `${titulo} · 1 célula por passo (números pares ou ímpares)`;
        article.append(alca);
    }
    const tamanhoDuranteAjuste = criar('span', 'util-tamanho-durante-ajuste');
    tamanhoDuranteAjuste.setAttribute('aria-hidden', 'true');
    article.append(tamanhoDuranteAjuste);
    return article;
}

/** Amplia o corpo e as tabelas, sem alterar o título.
 * As linhas da tabela distribuem a altura livre pelo CSS; a escala busca
 * o maior texto que não transborde, sem modificar as células salvas. */
export function ajustarEscalaConteudo(cartao) {
    if (!cartao || !cartao.classList.contains('util-tamanho-manual')) return;
    const corpo = cartao.querySelector('.util-cartao-corpo');
    const tabela = cartao.querySelector('.util-tabela-rolagem');
    const elementosTabela = tabela ? [...tabela.querySelectorAll('th, td')] : [];
    if (!corpo) return;
    const ajustar = (valor) => cartao.style.setProperty('--util-escala-conteudo', valor.toFixed(3));
    const cabe = () => corpo.scrollHeight <= corpo.clientHeight + 1
        && (!tabela || (
            tabela.scrollWidth <= tabela.clientWidth + 1
            && tabela.scrollHeight <= tabela.clientHeight + 1
        ))
        // Linhas da tabela também precisam comportar seu próprio texto.
        && elementosTabela.every((celula) => celula.scrollHeight <= celula.clientHeight + 2);
    ajustar(1);
    if (!cabe()) return;
    let inferior = 1;
    let superior = 2.8; // Fontes legíveis, sem títulos superdimensionados.
    ajustar(superior);
    if (cabe()) return;
    // Busca binária para obter a maior fonte legível dentro da área do cartão.
    for (let tentativa = 0; tentativa < 9; tentativa++) {
        const meio = (inferior + superior) / 2;
        ajustar(meio);
        if (cabe()) inferior = meio;
        else superior = meio;
    }
    // Pequena margem para diferenças de arredondamento entre navegadores.
    ajustar(Math.max(1, inferior - 0.015));
}
