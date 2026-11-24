import { botao, elemento, porId } from '../../core/dom.js?v=mesa-34';
import { inteiro, ordemDeIniciativa } from './combatentes.js?v=mesa-34';

function estrela(combatente, alternar) {
    const controle = botao('', () => alternar(combatente), 'combate-estrela');
    controle.classList.toggle('preparada', Boolean(combatente.preparada));
    controle.setAttribute('aria-label', combatente.preparada ? 'Desativar ação preparada' : 'Preparar ação');
    return controle;
}

function linhaCombatente(combatente, selecionado, acoes) {
    const linha = elemento('div', 'combate-linha');
    linha.classList.toggle('ativa', combatente.id === selecionado);
    linha.classList.toggle('combate-fora', inteiro(combatente.ferimentos, 0, 3) >= 3);
    const nome = botao(combatente.nome, () => acoes.selecionar(combatente), 'combate-nome');
    nome.append(elemento('small', '', combatente.responsavel));

    const iniciativa = elemento('input');
    iniciativa.type = 'number';
    iniciativa.value = combatente.iniciativa;
    iniciativa.setAttribute('aria-label', `Iniciativa de ${combatente.nome}`);
    iniciativa.addEventListener('input', () => acoes.mudarIniciativa(combatente, inteiro(iniciativa.value, -999, 999)));
    const preparar = estrela(combatente, acoes.preparar);
    preparar.title = 'Preparar ou consultar ação';
    const excluir = botao('×', () => acoes.remover(combatente.id), 'combate-excluir');
    excluir.title = `Remover ${combatente.nome} do combate`;
    excluir.setAttribute('aria-label', excluir.title);
    linha.append(excluir, nome, iniciativa, preparar);
    return linha;
}

function identificacao(combatente, classe, abrir) {
    const controle = botao('', () => abrir(combatente), classe);
    controle.append(elemento('strong', '', combatente.nome), elemento('small', '', combatente.responsavel));
    return controle;
}

export function mostrarIniciativa({ combatentes, ordem, atual, selecionado, animar }, acoes) {
    const lista = porId('combate-lista');
    lista.replaceChildren(...[...combatentes].sort(ordemDeIniciativa)
        .map((combatente) => linhaCombatente(combatente, selecionado, acoes)));

    if (!combatentes.length) {
        lista.append(elemento('p', 'rr-estado-vazio rr-estado-vazio--compacto',
            'Nenhum combatente adicionado.'));
    }

    const indice = ordem.findIndex((combatente) => combatente.id === atual);
    const proximos = indice < 0 ? ordem : [...ordem.slice(indice + 1), ...ordem.slice(0, indice)];
    const trilho = porId('combate-trilho');
    trilho.replaceChildren();
    for (const combatente of proximos) {
        const cartao = elemento('div', 'combate-turno');
        cartao.dataset.id = combatente.id;
        cartao.append(identificacao(combatente, 'combate-turno-identificacao', acoes.selecionar),
            estrela(combatente, acoes.preparar));
        trilho.append(cartao);
    }
    trilho.classList.toggle('combate-avancando', animar);
    const emAcao = porId('combate-atual');
    const combatente = ordem[indice];
    if (!combatente) {
        emAcao.textContent = 'Aguardando combatentes';
        return;
    }
    const consultar = identificacao(combatente, 'combate-ficha-em-acao', acoes.consultar);
    consultar.title = `Consultar ficha de ${combatente.nome}`;
    consultar.setAttribute('aria-label', consultar.title);
    emAcao.replaceChildren(consultar, estrela(combatente, acoes.preparar));
}
