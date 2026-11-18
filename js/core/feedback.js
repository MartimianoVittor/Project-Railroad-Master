let temporizador;

export function mostrarAviso(texto, erro = false) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.classList.toggle('erro', erro);
    aviso.classList.add('visivel');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('visivel'), 6500);
}

export async function executar(botao, tarefa) {
    if (botao.disabled) return;
    botao.disabled = true;
    try {
        await tarefa();
    } catch (erro) {
        console.error('Railroad Mestre:', erro);
        mostrarAviso(`Operação não concluída: ${erro.message}`, true);
    } finally {
        botao.disabled = false;
    }
}
