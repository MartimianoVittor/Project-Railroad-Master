import { elemento, porId } from '../../core/dom.js?v=mesa-35';

const LOCAIS = [
    { valor: 'personagem', classe: 'icone-chapeu', titulo: 'Chapéu: carregado pelo personagem' },
    { valor: 'montaria', classe: 'icone-alforge', titulo: 'Alforge: carregado pela montaria' },
];

function linhas() {
    return porId('npc-orig-lista-itens').rows;
}

function valorDaLinha(linha, campo) {
    return linha.querySelector(`[data-item="${campo}"]`).value;
}

export function lerItens() {
    return Array.from(linhas(), (linha) => ({
        local: valorDaLinha(linha, 'local') || 'personagem',
        nome: valorDaLinha(linha, 'nome'),
        quantidade: Number(valorDaLinha(linha, 'quantidade')) || 0,
        tamanho: Number(valorDaLinha(linha, 'tamanho')) || 0,
        descricao: valorDaLinha(linha, 'descricao'),
    }));
}

function atualizarPeso() {
    const totais = { personagem: 0, montaria: 0 };
    for (const item of lerItens()) {
        totais[item.local] += Math.max(0, item.quantidade) * Math.max(0, item.tamanho);
    }
    porId('npc-orig-espaco-ocupado-jogador').value = totais.personagem;
    porId('npc-orig-espaco-ocupado-montaria').value = totais.montaria;
}

function seletorDeLocal(local) {
    const campo = elemento('select', 'npc-local-valor');
    campo.dataset.item = 'local';
    campo.setAttribute('aria-label', 'Local do item');
    const controles = elemento('div', 'local-item-controles');
    controles.setAttribute('role', 'group');
    controles.setAttribute('aria-label', 'Local do item');
    for (const { valor, classe, titulo } of LOCAIS) {
        const opcao = elemento('option', '', valor === 'personagem' ? 'Personagem' : 'Montaria');
        opcao.value = valor;
        campo.append(opcao);

        const botao = elemento('button', `botao-local-item ${classe}`);
        botao.type = 'button';
        botao.title = titulo;
        botao.dataset.local = valor;
        botao.setAttribute('aria-label', titulo);
        botao.setAttribute('aria-pressed', String(local === valor));
        botao.addEventListener('click', () => {
            campo.value = campo.value === valor ? '' : valor;
            for (const controle of controles.children) {
                controle.setAttribute('aria-pressed', String(controle.dataset.local === campo.value));
            }
            campo.dispatchEvent(new Event('change', { bubbles: true }));
        });
        controles.append(botao);
    }
    campo.value = local;
    const celula = elemento('td');
    celula.append(controles, campo);
    return celula;
}

function linhaDeItem(item = {}) {
    const linha = elemento('tr');
    linha.append(seletorDeLocal(item.local === 'montaria' ? 'montaria' : 'personagem'));
    for (const [chave, tipo, padrao] of [
        ['nome', 'text', ''], ['quantidade', 'number', 1],
        ['tamanho', 'number', 1], ['descricao', 'text', ''],
    ]) {
        const campo = elemento('input');
        campo.dataset.item = chave;
        campo.type = tipo;
        campo.value = item[chave] ?? padrao;
        if (tipo === 'number') {
            campo.min = '0';
            campo.step = '1';
        }
        linha.insertCell().append(campo);
    }
    const remover = elemento('button', '', '×');
    remover.type = 'button';
    remover.setAttribute('aria-label', 'Remover item');
    remover.addEventListener('click', () => {
        linha.remove();
        porId('npc-orig-lista-itens').dispatchEvent(new Event('change', { bubbles: true }));
    });
    linha.insertCell().append(remover);
    return linha;
}

export function preencherItens(itens) {
    porId('npc-orig-lista-itens').replaceChildren(...itens.map(linhaDeItem));
    atualizarPeso();
}

export function iniciarInventario() {
    const lista = porId('npc-orig-lista-itens');
    lista.addEventListener('input', atualizarPeso);
    lista.addEventListener('change', atualizarPeso);
    porId('npc-adicionar-item').addEventListener('click', () => {
        lista.append(linhaDeItem());
        lista.dispatchEvent(new Event('change', { bubbles: true }));
    });
}
