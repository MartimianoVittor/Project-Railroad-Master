import { elemento, porId } from '../core/dom.js?v=mesa-35';
import { ARMAS_NPC, CONDICOES_NPC, DISTANCIAS_NPC, TRACOS_NPC } from './npcs.js?v=mesa-35';
import { DADOS_DE_TRACO } from './rolagem.js?v=mesa-35';
import { iniciarInventario, lerItens, preencherItens } from './npcs/inventario.js?v=mesa-35';

const CAMPOS = {
    'nome-personagem': 'nome', 'apelido-personagem': 'apelido',
    'profissao-personagem': 'profissao', 'lingua-personagem': 'linguas',
    fama: 'fama', palavra: 'palavra', dinheiro: 'dinheiro',
    'bio-personagem': 'descricao', papel: 'papel', notas: 'notas',
    'espaco-maximo-jogador': 'capacidadePersonagem',
    'espaco-maximo-montaria': 'capacidadeMontaria',
};
const RETRATO_PADRAO = 'assets/imgs/imagemPersonagemPlaceholder.webp';

function campoNpc(id) {
    return porId(`npc-orig-${id}`);
}

function marcadores(grupo) {
    return porId('form-npc').querySelectorAll(`[data-grupo="${grupo}"]`);
}

function marcarAte(grupo, quantidade) {
    marcadores(grupo).forEach((campo, indice) => { campo.checked = indice < quantidade; });
}

function contarMarcas(grupo) {
    return Array.from(marcadores(grupo)).filter((campo) => campo.checked).length;
}

export function nivelNoFormulario(traco) {
    return contarMarcas(`traco-${TRACOS_NPC.indexOf(traco) + 1}`);
}

function criarLinhaTraco(nome, indice) {
    const linha = elemento('div', 'linha-check linha-traco');
    const grupo = `traco-${indice + 1}`;
    const dados = elemento('div', 'tracos-box');
    for (const [nivel, faces] of DADOS_DE_TRACO.entries()) {
        const rotulo = elemento('label', 'marcador-dado');
        rotulo.title = `${nome} — d${faces}`;
        const campo = elemento('input', 'check-tracos');
        campo.type = 'checkbox';
        campo.dataset.grupo = grupo;
        campo.setAttribute('aria-label', `${nome}, d${faces}`);
        campo.addEventListener('change', () => marcarAte(grupo, nivel + Number(campo.checked)));
        const icone = elemento('span', 'marcador-dado-visual');
        icone.setAttribute('aria-hidden', 'true');
        rotulo.append(campo, icone);
        dados.append(rotulo);
    }
    linha.append(elemento('label', 'nome-traco', `${nome}:`), dados);
    return linha;
}

export function iniciarFormularioNpc() {
    porId('npc-grade-tracos').append(...TRACOS_NPC.map(criarLinhaTraco));
    iniciarInventario();
}

export function mostrarRetrato(imagem) {
    campoNpc('foto-personagem').src = imagem || RETRATO_PADRAO;
}

export function preencherFormulario(npc) {
    for (const [id, chave] of Object.entries(CAMPOS)) campoNpc(id).value = npc[chave] ?? '';
    TRACOS_NPC.forEach((traco, indice) => marcarAte(`traco-${indice + 1}`, npc.tracos[traco]));
    for (const [chave] of CONDICOES_NPC) marcarAte(chave, npc.condicoes[chave]);
    for (const [chave] of ARMAS_NPC) {
        const arma = npc.armas[chave];
        campoNpc(`arma-${chave}`).value = arma.nome;
        campoNpc(`municao-${chave}`).value = arma.municao;
        for (const [distancia] of DISTANCIAS_NPC) {
            campoNpc(`bonus-${chave}-${distancia}`).value = arma.bonus[distancia];
        }
    }
    campoNpc('escolher-foto-personagem').value = '';
    mostrarRetrato(npc.imagem);
    preencherItens(npc.itens);
}

// Parte da ficha carregada para conservar campos de versões anteriores sem editor visual.
export function lerFormulario(ficha) {
    const npc = structuredClone(ficha);
    for (const [id, chave] of Object.entries(CAMPOS)) npc[chave] = campoNpc(id).value;
    for (const traco of TRACOS_NPC) npc.tracos[traco] = nivelNoFormulario(traco);
    for (const [chave] of CONDICOES_NPC) npc.condicoes[chave] = contarMarcas(chave);
    for (const [chave] of ARMAS_NPC) {
        const arma = npc.armas[chave];
        arma.nome = campoNpc(`arma-${chave}`).value;
        arma.municao = campoNpc(`municao-${chave}`).value;
        for (const [distancia] of DISTANCIAS_NPC) {
            arma.bonus[distancia] = campoNpc(`bonus-${chave}-${distancia}`).value;
        }
    }
    npc.itens = lerItens();
    npc.nivelPrincipal = npc.tracos[npc.tracoPrincipal];
    npc.tipo = 'completa';
    return npc;
}
