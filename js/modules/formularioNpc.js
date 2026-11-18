import { porId, elemento } from '../core/dom.js';
import { ARMAS_NPC, CONDICOES_NPC, DISTANCIAS_NPC, NIVEIS_NPC, TRACOS_NPC } from './npcs.js';

/** Monta controles repetitivos sem ampliar o fragmento HTML da página. */
function criarOpcao(valorOpcao, rotulo) {
    const opcao = elemento('option', '', rotulo);
    opcao.value = String(valorOpcao);
    return opcao;
}

function preencherOpcoes(seletor, opcoes) {
    seletor.replaceChildren(...opcoes.map(([valorOpcao, rotulo]) => criarOpcao(valorOpcao, rotulo)));
}

function criarCampo(rotulo, id, opcoes) {
    const label = elemento('label', '', rotulo);
    const select = elemento('select');
    select.id = id;
    preencherOpcoes(select, opcoes);
    label.append(select);
    return label;
}

export function montarCamposDinamicosNpc() {
    const opcoesNivel = NIVEIS_NPC.map((rotulo, indice) => [indice, rotulo]);
    const opcoesMarcas = Array.from({ length: 4 }, (_, indice) => [indice, String(indice)]);

    preencherOpcoes(porId('npc-traco-principal'), TRACOS_NPC.map((nome) => [nome, nome]));
    preencherOpcoes(porId('npc-nivel-principal'), opcoesNivel);
    preencherOpcoes(porId('npc-ferimentos-simples'), opcoesMarcas);

    const tracos = porId('npc-grade-tracos');
    const condicoes = porId('npc-grade-condicoes');
    const armas = porId('npc-grade-armas');
    const tracosSimples = porId('npc-grade-tracos-simples');
    for (const grade of [tracos, tracosSimples]) {
        const cabecalho = elemento('div', 'npc-tracos-cabecalho');
        for (const titulo of ['TRAÇOS', 'd4', 'd6', 'd8', 'd12']) cabecalho.append(elemento('span', '', titulo));
        grade.append(cabecalho);
        for (const [indice, nome] of TRACOS_NPC.entries()) {
            const linha = elemento('div', 'npc-traco-editor linha-check linha-traco');
            linha.append(elemento('strong', 'nome-traco', `${nome}:`));
            const gotas = elemento('div', 'npc-gotas-editor tracos-box');
            for (let nivel = 1; nivel <= 4; nivel++) {
                const gota = elemento('button', 'npc-gota check-tracos');
                gota.type = 'button';
                gota.dataset.nivel = String(nivel);
                gota.setAttribute('aria-label', `${nome}: nível ${nivel}`);
                gota.addEventListener('click', () => {
                    const input = porId(`npc-traco-${indice}`);
                    input.value = String(Number(input.value) === nivel ? 0 : nivel);
                    atualizarGotasNpc();
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
                gotas.append(gota);
            }
            linha.append(gotas);
            grade.append(linha);
        }
    }
    // Mantém os selects para compatibilidade com o modelo e os registros antigos.
    const selects = elemento('div', 'npc-legado-oculto');
    selects.hidden = true;
    for (const [indice, nome] of TRACOS_NPC.entries()) {
        selects.append(criarCampo(nome, `npc-traco-${indice}`, opcoesNivel));
    }
    tracos.after(selects);
    for (const [chave, rotulo] of CONDICOES_NPC) {
        condicoes.append(criarCampo(`${rotulo} (0–3)`, `npc-condicao-${chave}`, opcoesMarcas));
    }
    for (const [chave, rotulo] of ARMAS_NPC) {
        const secao = elemento('fieldset', 'npc-arma-form cartao-arma');
        secao.append(elemento('legend', '', `Arma ${rotulo.toLowerCase()}`));
        const dados = elemento('div', 'grade-campos-npc');
        const nomeLabel = elemento('label', '', 'Nome da arma');
        const nome = elemento('input');
        nome.id = `npc-arma-${chave}-nome`;
        nome.type = 'text';
        nome.maxLength = 100;
        nomeLabel.append(nome);
        const municaoLabel = elemento('label', '', 'Munição');
        const municao = elemento('input');
        municao.id = `npc-arma-${chave}-municao`;
        municao.type = 'number';
        municao.min = '0';
        municao.max = '9999';
        municaoLabel.append(municao);
        dados.append(nomeLabel, municaoLabel);
        for (const [distancia, titulo] of DISTANCIAS_NPC) {
            dados.append(criarCampo(`Bônus · ${titulo}`, `npc-arma-${chave}-${distancia}`,
                Array.from({ length: 7 }, (_, indice) => [indice - 3, String(indice - 3)])));
        }
        secao.append(dados);
        armas.append(secao);
        // Uma só fonte de dados: os mesmos campos de arma são deslocados entre os modos.

    }
}


export function atualizarGotasNpc() {
    for (const grade of [porId('npc-grade-tracos'), porId('npc-grade-tracos-simples')]) {
        for (const [indice, linha] of [...grade.querySelectorAll('.npc-traco-editor')].entries()) {
            const nivel = Number(porId(`npc-traco-${indice}`).value);
            for (const gota of linha.querySelectorAll('.npc-gota')) {
                const ativa = Number(gota.dataset.nivel) <= nivel;
                gota.classList.toggle('marcada', ativa);
                gota.setAttribute('aria-pressed', String(ativa));
            }
        }
    }
}
