/** Indicador de operações assíncronas, sem bloquear cliques em outras áreas. */
const tarefas = new Map();
let aviso;
let contador = 0;

function desenhar() {
    if (typeof document === 'undefined' || !document.body) return;
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.className = 'rr-aviso-processamento';
        aviso.hidden = true;
        aviso.setAttribute('role', 'status');
        aviso.setAttribute('aria-live', 'polite');
        const roda = document.createElement('span');
        roda.className = 'rr-roda';
        roda.setAttribute('aria-hidden', 'true');
        const mensagem = document.createElement('span');
        mensagem.className = 'rr-mensagem-processamento';
        aviso.append(roda, mensagem);
        document.body.append(aviso);
    }
    const atual = [...tarefas.values()].at(-1);
    aviso.hidden = !atual;
    if (atual) aviso.querySelector('.rr-mensagem-processamento').textContent = atual;
}

/** Só exibe após 180 ms para evitar piscadas em ações instantâneas. */
export function iniciarProcessamento(mensagem = 'Processando…') {
    const id = ++contador;
    let finalizado = false;
    const temporizador = setTimeout(() => {
        if (finalizado) return;
        tarefas.set(id, mensagem);
        desenhar();
    }, 180);
    return () => {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(temporizador);
        tarefas.delete(id);
        desenhar();
    };
}

export async function comProcessamento(mensagem, tarefa) {
    const concluir = iniciarProcessamento(mensagem);
    try { return await tarefa(); }
    finally { concluir(); }
}
