import { botao, elemento } from '../../core/dom.js?v=mesa-34';

const CONDICOES = [
    ['Abalado', 'Sofre penalidade em ações sob pressão'],
    ['Agarrado', 'Movimento restringido'],
    ['Atordoado', 'Dificuldade para agir'],
    ['Caído', 'Precisa se levantar'],
    ['Cego', 'Não consegue enxergar'],
    ['Desarmado', 'Sem arma disponível'],
    ['Exposto', 'Vulnerável à situação'],
    ['Imobilizado', 'Não consegue se deslocar'],
    ['Inconsciente', 'Não pode agir'],
    ['Pesado', 'Movimento reduzido e -1 em testes físicos'],
    ['Sangrando', 'Requer atenção e tratamento'],
    ['Surdo', 'Não consegue ouvir'],
];

export function abrirSeletorCondicoes(aoIncluir) {
    let dialogo = document.getElementById('combate-modal-condicoes');
    if (!dialogo) {
        dialogo = elemento('dialog', 'combate-modal combate-modal-condicoes');
        dialogo.id = 'combate-modal-condicoes';
        document.body.append(dialogo);
    }
    dialogo.replaceChildren();
    const topo = elemento('div', 'combate-condicoes-cabecalho');
    topo.append(elemento('h3', '', 'Adicionar condição'), botao('×', () => dialogo.close(), 'botao'));
    const busca = elemento('input');
    busca.type = 'search';
    busca.placeholder = 'Buscar condição pelo nome ou efeito';
    busca.setAttribute('aria-label', 'Buscar condição');
    const lista = elemento('div', 'combate-condicoes-opcoes');
    const incluir = (nome, efeito) => {
        aoIncluir({
            nome,
            efeito
        });
        dialogo.close();
    };
    const desenhar = () => {
        lista.replaceChildren();
        const filtro = busca.value.toLocaleLowerCase('pt-BR');
        CONDICOES.forEach(([nome, efeito]) => {
            if (!`${nome} ${efeito}`.toLocaleLowerCase('pt-BR').includes(filtro))
                return;
            const opcao = botao('', () => incluir(nome, efeito), 'combate-condicao-opcao');
            opcao.append(elemento('strong', '', nome), elemento('span', '', efeito));
            lista.append(opcao);
        });
        if (!lista.children.length)
            lista.append(elemento('p', '', 'Nenhuma condição encontrada.'));
    };
    busca.addEventListener('input', desenhar);
    desenhar();
    const personalizado = elemento('div', 'combate-condicao-personalizada');
    personalizado.append(elemento('h4', '', 'Criar condição personalizada'));
    const nome = elemento('input');
    nome.placeholder = 'Nome da condição';
    nome.setAttribute('aria-label', 'Nome da condição personalizada');
    const descricao = elemento('textarea');
    descricao.rows = 3;
    descricao.placeholder = 'Descrição completa do efeito';
    descricao.setAttribute('aria-label', 'Descrição da condição personalizada');
    const criar = botao('Criar e adicionar', () => {
        if (!nome.value.trim()) {
            nome.focus();
            return;
        }
        incluir(nome.value.trim(), descricao.value.trim());
    }, 'botao combate-botao-amarelo');
    personalizado.append(nome, descricao, criar);
    dialogo.append(topo, busca, lista, personalizado);
    dialogo.showModal();
}
