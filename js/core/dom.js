import { executar } from './feedback.js?v=mesa-35';

export const porId = (id) => document.getElementById(id);

export function elemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = String(texto);
    return el;
}

export function mensagemLista(lista, mensagem) {
    lista.append(elemento('li', 'sem-resultados rr-estado-vazio rr-estado-vazio--compacto', mensagem));
}

export function dataBreve(valor) {
    if (!valor) return 'Data não informada';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Data não informada' : data.toLocaleDateString('pt-BR');
}

export function botaoAcao(rotulo, tarefa, classe = 'botao botao-pequeno') {
    const botao = elemento('button', classe, rotulo);
    botao.type = 'button';
    botao.addEventListener('click', () => void executar(botao, tarefa));
    return botao;
}

/** Botão de interface com ação imediata, como selecionar um cartão ou fechar um diálogo. */
export function botao(rotulo, aoClicar, classe = 'botao') {
    const controle = elemento('button', classe, rotulo);
    controle.type = 'button';
    controle.addEventListener('click', aoClicar);
    return controle;
}
