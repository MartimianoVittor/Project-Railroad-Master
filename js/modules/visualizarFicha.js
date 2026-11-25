/**
 * Visualização somente leitura das três partes da ficha do Railroad Jogador.
 * Não cria controles editáveis nem interpreta HTML recebido dos jogadores.
 * O quadro de ideias não faz parte dos dados solicitados pela RPC do Mestre.
 */
import { ARMAS, CONDICOES, DISTANCIAS, TRACOS, nivelTraco } from './ficha/campos.js?v=mesa-35';

export { nivelTraco };

export const PARTES_FICHA = Object.freeze({
    jogador: 'Jogador',
    personagem: 'Personagem',
    inventario: 'Inventário',
});

const texto = (valor, vazio = '—') => String(valor ?? '').trim() || vazio;

function criar(tag, classe = '', conteudo = null) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (conteudo !== null) no.textContent = texto(conteudo);
    return no;
}

function bloco(titulo, conteudo) {
    const secao = criar('section', 'ficha-bloco');
    secao.append(criar('h4', '', titulo), conteudo);
    return secao;
}

function campos(registros) {
    const lista = criar('dl', 'ficha-campos');
    for (const [rotulo, valor] of registros) {
        const linha = criar('div', 'ficha-campo');
        linha.append(criar('dt', '', rotulo), criar('dd', '', valor));
        lista.append(linha);
    }
    return lista;
}

function retrato(src, nome, tipo = 'personagem') {
    // A estrela e o cartaz são a moldura inteira, não a fotografia.
    // A foto fica recortada na área central exatamente como no Jogador mobile.
    const moldura = criar('div', `ficha-retrato rr-retrato-${tipo}`);
    const foto = criar('div', 'rr-retrato-foto');
    const imagem = criar('img');
    const padrao = tipo === 'jogador'
        ? 'assets/imgs/fundoCinza.jpg'
        : 'assets/imgs/imagemPersonagemPlaceholder.webp';
    const permitido = typeof src === 'string' && (
        /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(src)
        || /^assets\/imgs\/[\w.-]+\.(?:png|jpe?g|webp|gif)$/i.test(src)
    );
    const origem = permitido ? src : padrao;
    // No Jogador o placeholder de personagem já é o próprio cartaz.
    // Exibi-lo como fotografia duplicaria a moldura.
    const cartazPadrao = tipo === 'personagem' && (
        !permitido || origem.endsWith('/imagemPersonagemPlaceholder.webp')
    );
    if (!cartazPadrao) {
        imagem.src = origem;
        imagem.alt = `Retrato de ${texto(nome, tipo)}`;
        imagem.loading = 'lazy';
        imagem.onerror = () => {
            if (tipo === 'personagem') {
                imagem.remove();
            } else if (!imagem.src.endsWith(padrao)) {
                imagem.src = padrao;
            }
        };
        foto.append(imagem);
    }
    moldura.append(foto);
    return moldura;
}

function identidade(nome, apelido) {
    const cabecalho = criar('div', 'ficha-identidade');
    cabecalho.append(criar('strong', '', nome));
    if (texto(apelido, '') !== '—' && String(apelido ?? '').trim()) {
        cabecalho.append(criar('small', '', apelido));
    }
    return cabecalho;
}

// Campos de consulta seguem a hierarquia visual grupo-campo/label-campo
// dos formulários mobile originais, mas não são editáveis.
function campoOriginal(rotulo, valor, longo = false) {
    const grupo = criar('div', 'grupo-campo rr-campo-original');
    grupo.append(criar('span', 'label-campo', rotulo));
    const leitura = criar('div', `rr-valor-campo${longo ? ' rr-textarea' : ''}`, valor);
    leitura.setAttribute('aria-label', rotulo);
    grupo.append(leitura);
    return grupo;
}
function conjuntoOriginal(campos) {
    const grupo = criar('div', 'campos-texto-container');
    for (const [nome, valor, longo] of campos) grupo.append(campoOriginal(nome, valor, longo));
    return grupo;
}
function parteJogador(registro) {
    const dados = registro.dados || {};
    const conteudo = criar('div', 'rr-ficha-mobile rr-ficha-jogador');
    conteudo.append(retrato(dados.fotoPerfil, dados.nome, 'jogador'), conjuntoOriginal([
        ['Nome:', dados.nome], ['Apelido:', dados.apelido], ['Sobre Você:', dados.bio, true],
    ]));
    return conteudo;
}

// Mesmos SVGs e disposição de caveiras/gotas da ficha mobile do Jogador.
// A consulta do Mestre é somente leitura; os marcadores não são inputs.
function marcador(tipo, marcado, descricao) {
    const marca = criar('span', `rr-marcador rr-${tipo}${marcado ? ' marcado' : ''}`);
    marca.setAttribute('role', 'img');
    marca.setAttribute('aria-label', `${descricao}: ${marcado ? 'marcado' : 'livre'}`);
    return marca;
}

function condicoes(marcadores) {
    const grade = criar('div', 'rr-condicoes');
    for (const [chave, rotulo] of CONDICOES) {
        const linha = criar('div', 'rr-linha-marcadores');
        const marcas = criar('div', 'rr-caveiras');
        const valores = Array.isArray(marcadores[chave]) ? marcadores[chave] : [];
        for (let indice = 0; indice < 3; indice++) {
            marcas.append(marcador('caveira', valores[indice] === true, `${rotulo} ${indice + 1}`));
        }
        linha.append(criar('strong', '', `${rotulo}:`), marcas);
        grade.append(linha);
    }
    return grade;
}

function tracos(marcadores) {
    const lista = criar('div', 'rr-tracos');
    const cabecalho = criar('div', 'rr-tracos-cabecalho');
    for (const titulo of ['TRAÇOS', 'd4', 'd6', 'd8', 'd12']) cabecalho.append(criar('span', '', titulo));
    lista.append(cabecalho);
    for (const [indice, nome] of TRACOS.entries()) {
        const nivel = nivelTraco(marcadores[`traco-${indice + 1}`]);
        const linha = criar('div', 'rr-traco-linha');
        linha.append(criar('strong', '', `${nome}:`));
        const marcas = criar('div', 'rr-gotas');
        for (let dado = 1; dado <= 4; dado++) {
            marcas.append(marcador('gota', dado <= nivel, `${nome}, ${['d4','d6','d8','d12'][dado - 1]}`));
        }
        linha.append(marcas);
        lista.append(linha);
    }
    return lista;
}

function partePersonagem(registro) {
    const personagem = registro.dados?.personagem || {};
    const marcadores = personagem.marcadores || {};
    const nome = texto(personagem['nome-personagem'], registro.titulo);
    const conteudo = criar('div', 'rr-ficha-mobile rr-ficha-personagem');
    const identidade = criar('section', 'rr-secao-original');
    identidade.append(retrato(personagem.foto, nome), conjuntoOriginal([
        ['Nome:', nome], ['Apelido:', personagem['apelido-personagem']],
        ['Profissão:', personagem['profissao-personagem']],
        ['Língua:', personagem['lingua-personagem']],
    ]));
    const status = criar('section', 'rr-secao-original');
    status.append(conjuntoOriginal([
        ['Fama:', personagem.fama], ['Palavra:', personagem.palavra],
        ['Dinheiro:', personagem.dinheiro],
    ]), condicoes(marcadores), conjuntoOriginal([
        ['Sobre Você:', personagem['bio-personagem'], true],
    ]));
    const dados = criar('section', 'rr-secao-original');
    dados.append(tracos(marcadores));
    conteudo.append(identidade, status, dados);
    return conteudo;
}

function numeroNaoNegativo(valor) {
    const numero = Number(String(valor ?? '').replace(',', '.'));
    return Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : 0;
}

function capacidades(itens, rolagens) {
    const totais = { jogador: 0, montaria: 0 };
    for (const item of itens) {
        if (!Object.hasOwn(totais, item.local)) continue;
        totais[item.local] += numeroNaoNegativo(item.quantidade) * numeroNaoNegativo(item.tamanho);
    }
    // Os quatro campos seguem a mesma disposição do resumo do Jogador.
    const resumo = criar('div', 'inventario-resumo rr-inventario-resumo');
    for (const [local, rotulo] of [['jogador', 'Personagem'], ['montaria', 'Montaria']]) {
        const capacidade = local === 'jogador'
            ? rolagens['espaco-maximo-jogador'] ?? rolagens['espaco-maximo']
            : rolagens['espaco-maximo-montaria'];
        for (const [titulo, valor, ocupado] of [
            [`${rotulo} · Ocupado`, totais[local], true],
            [`${rotulo} · Capacidade`, texto(capacidade, '0'), false],
        ]) {
            const campo = criar('div', 'inventario-resumo-campo');
            campo.append(criar('span', '', titulo), criar('output', ocupado ? 'rr-capacidade-ocupada' : '', valor));
            resumo.append(campo);
        }
    }
    return resumo;
}

function armas(rolagens) {
    const lista = criar('div', 'rr-armas-lista');
    for (const [chave, rotulo] of ARMAS) {
        const arma = criar('fieldset', 'cartao-arma rr-cartao-arma');
        arma.append(criar('legend', '', `Arma ${rotulo.toLowerCase()}`));
        const cabecalho = criar('div', 'arma-linha-nome');
        const nome = criar('div', 'arma-nome');
        nome.append(criar('span', 'campo-inventario rr-campo-arma', texto(rolagens[`arma-${chave}`], 'Nome da arma')));
        const municao = criar('div', 'arma-municao');
        municao.setAttribute('aria-label', `Munição da arma ${rotulo.toLowerCase()}`);
        municao.append(criar('span', 'arma-municao-titulo', 'Munição'));
        const quantidade = criar('div', 'arma-municao-controles');
        quantidade.append(criar('output', 'municao-valor', texto(rolagens[`municao-${chave}`], '0')));
        municao.append(quantidade);
        cabecalho.append(nome, municao);
        const bonus = criar('div', 'bonus-distancias');
        for (const [distancia, titulo] of DISTANCIAS) {
            const valor = rolagens[`bonus-${chave}-${distancia}`] ?? rolagens[`bonus-${chave}`] ?? '0';
            const campo = criar('div', 'bonus-distancia');
            campo.append(criar('span', '', titulo), criar('output', 'campo-inventario', texto(valor, '0')));
            bonus.append(campo);
        }
        arma.append(cabecalho, bonus);
        lista.append(arma);
    }
    return lista;
}

function tabelaItens(itens) {
    if (!itens.length) return criar('p', 'ficha-texto rr-estado-vazio rr-estado-vazio--compacto', 'Nenhum item registrado.');

    const rolagem = criar('div', 'ficha-tabela-scroll');
    const tabela = criar('table', 'ficha-tabela tabela-itens');
    const cabecalho = criar('thead');
    const titulos = criar('tr');
    for (const titulo of ['Item', 'Qtd.', 'Tam.', 'Local', 'Descrição']) {
        titulos.append(criar('th', '', titulo));
    }
    cabecalho.append(titulos);
    const corpo = criar('tbody');
    for (const item of itens) {
        const linha = criar('tr');
        const celulaLocal = criar('td', 'celula-local-item');
        const controles = criar('div', 'local-item-controles');
        controles.setAttribute('role', 'group');
        controles.setAttribute('aria-label', 'Local do item');
        for (const [local, icone, titulo] of [
            ['jogador', 'chapeu', 'Carregado pelo personagem'],
            ['montaria', 'alforge', 'Carregado pela montaria'],
        ]) {
            const iconeLocal = criar('span', `botao-local-item icone-${icone}`);
            iconeLocal.setAttribute('role', 'img');
            iconeLocal.setAttribute('aria-label', titulo);
            iconeLocal.setAttribute('aria-pressed', String(
                item.local === local || (local === 'jogador' && item.local === 'personagem')
            ));
            controles.append(iconeLocal);
        }
        celulaLocal.append(controles);
        linha.append(celulaLocal);
        for (const valor of [item.nome, item.quantidade, item.tamanho, item.descricao]) {
            linha.append(criar('td', '', valor));
        }
        corpo.append(linha);
    }
    tabela.append(cabecalho, corpo);
    rolagem.append(tabela);
    return rolagem;
}

function parteInventario(registro) {
    const inventario = registro.dados?.inventario || {};
    const itens = Array.isArray(inventario.itens)
        ? inventario.itens.filter((item) => item && typeof item === 'object') : [];
    const rolagens = inventario.rolagens || {};
    const conteudo = criar('div', 'rr-ficha-mobile rr-ficha-inventario');
    const cabecalho = criar('section', 'rr-secao-original');
    cabecalho.append(criar('h4', 'inventario-cabecalho', 'Inventário'), capacidades(itens, rolagens));
    const equipamento = criar('section', 'rr-secao-original');
    equipamento.append(criar('h4', '', 'Armas e munição'), armas(rolagens));
    const itensBloco = criar('section', 'rr-secao-original');
    itensBloco.append(criar('h4', '', 'Itens'), tabelaItens(itens));
    conteudo.append(equipamento, cabecalho, itensBloco);
    return conteudo;
}

/** Cria uma coluna de leitura, sem mutar o registro recebido. */
export function criarParteFicha(registro, parte, { comparacao = false } = {}) {
    if (!Object.hasOwn(PARTES_FICHA, parte)) throw new Error('Parte de ficha desconhecida.');

    const personagem = registro.dados?.personagem || {};
    const nomePersonagem = texto(personagem['nome-personagem'], registro.titulo);
    const nomeJogador = texto(registro.dados?.nome, 'Jogador sem nome');
    const coluna = criar('article', 'ficha-parte');
    const cabecalho = criar('header', 'ficha-parte-cabecalho');
    const titulo = comparacao
        ? parte === 'jogador' ? nomeJogador : nomePersonagem
        : PARTES_FICHA[parte];
    cabecalho.append(criar('h3', '', titulo));
    if (comparacao) {
        cabecalho.append(criar('small', '', parte === 'jogador' ? nomePersonagem : nomeJogador));
    }

    const corpo = criar('div', 'ficha-parte-corpo');
    const construir = {
        jogador: parteJogador,
        personagem: partePersonagem,
        inventario: parteInventario,
    };
    corpo.append(construir[parte](registro));
    coluna.append(cabecalho, corpo);
    return coluna;
}
