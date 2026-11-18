import { elemento } from '../core/dom.js';
import { ARMAS_NPC, CONDICOES_NPC, DISTANCIAS_NPC, TRACOS_NPC, rotuloNivelNpc } from './npcs.js';

/** Consulta somente leitura: usa textContent para todos os dados de NPCs. */
const texto = (valorCampo, padrao = '—') => String(valorCampo ?? '').trim() || padrao;

function bloco(titulo, conteudo) {
    const secao = elemento('section', 'npc-bloco rr-secao-original');
    secao.append(elemento('h3', '', titulo), conteudo);
    return secao;
}

function detalhes(campos) {
    const lista = elemento('div', 'campos-texto-container rr-campos-npc');
    for (const [rotulo, conteudo] of campos) {
        const campo = elemento('div', 'grupo-campo rr-campo-original');
        const titulo = elemento('span', 'label-campo', `${rotulo}:`);
        const valor = elemento('div', 'rr-valor-campo', texto(conteudo));
        campo.append(titulo, valor);
        lista.append(campo);
    }
    return lista;
}

// Reutiliza as classes e os ícones SVG da versão mobile do Jogador.
function marcas(tipo, quantidade, total, rotulo) {
    const grupo = elemento('div', tipo === 'gota' ? 'rr-gotas' : 'rr-caveiras');
    const valor = Math.max(0, Math.min(total, Number(quantidade) || 0));
    for (let i = 0; i < total; i++) {
        const item = elemento('span', `rr-marcador rr-${tipo}${i < valor ? ' marcado' : ''}`);
        item.setAttribute('role', 'img');
        item.setAttribute('aria-label', `${rotulo} ${i + 1}: ${i < valor ? 'marcado' : 'livre'}`);
        grupo.append(item);
    }
    return grupo;
}

function tracosVisuais(npc) {
    const lista = elemento('div', 'rr-tracos grupo-tracos');
    const cabecalho = elemento('div', 'rr-tracos-cabecalho');
    for (const nome of ['TRAÇOS', 'd4', 'd6', 'd8', 'd12']) cabecalho.append(elemento('span', '', nome));
    lista.append(cabecalho);
    for (const nome of TRACOS_NPC) {
        const linha = elemento('div', 'rr-traco-linha');
        linha.append(elemento('strong', '', `${nome}:`), marcas('gota', npc.tracos[nome], 4, nome));
        lista.append(linha);
    }
    return lista;
}

function condicoesVisuais(npc) {
    const lista = elemento('div', 'rr-condicoes grupo-caveiras');
    for (const [chave, nome] of CONDICOES_NPC) {
        const linha = elemento('div', 'rr-linha-marcadores');
        linha.append(elemento('strong', '', `${nome}:`), marcas('caveira', npc.condicoes[chave], 3, nome));
        lista.append(linha);
    }
    return lista;
}

export function renderizarFichaNpc(npc, conteudo) {
    conteudo.replaceChildren();
    const retrato = elemento('div', 'npc-retrato-consulta');
    const foto = elemento('img');
    foto.src = npc.imagem || 'assets/imgs/imagemPersonagemPlaceholder.png';
    foto.alt = `Retrato de ${npc.nome}`;
    retrato.append(foto);
    conteudo.append(retrato);
    conteudo.append(bloco('Identidade', detalhes([
        ['Função', npc.papel],
        ...(npc.tipo === 'completa' ? [['Apelido', npc.apelido], ['Profissões', npc.profissao], ['Línguas', npc.linguas]] : []),
    ])));
    if (npc.descricao) conteudo.append(bloco('Descrição / aparência', elemento('p', '', npc.descricao)));

    if (npc.tipo === 'simples') {
        conteudo.append(bloco('Dados rápidos', detalhes([
            ['Traço principal', npc.tracoPrincipal],
            ['Nível', rotuloNivelNpc(npc.nivelPrincipal)],
            ['Ferimentos', `${npc.condicoes.ferimentos} / 3`],
        ])));
    } else {
        conteudo.append(bloco('Reconhecimento', detalhes([
            ['Fama', npc.fama], ['Palavra', npc.palavra], ['Dinheiro', npc.dinheiro],
        ])));
        conteudo.append(bloco('Traços e dados', tracosVisuais(npc)));
        conteudo.append(bloco('Condições', condicoesVisuais(npc)));
        for (const [chave, rotulo] of ARMAS_NPC) {
            const arma = npc.armas[chave];
            conteudo.append(bloco(`Arma ${rotulo.toLowerCase()}`, detalhes([
                ['Nome', arma.nome], ['Munição', arma.municao],
                ...DISTANCIAS_NPC.map(([distancia, nome]) => [nome, arma.bonus[distancia]]),
            ])));
        }
        if (npc.inventario) conteudo.append(bloco('Inventário e equipamentos', elemento('p', '', npc.inventario)));
    }
    if (npc.notas) conteudo.append(bloco('Notas do mestre', elemento('p', '', npc.notas)));

}
