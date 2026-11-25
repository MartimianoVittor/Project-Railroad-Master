const PAGINAS = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];

/**
 * A navegação altera apenas a área visível. O estado da campanha e a sessão
 * autenticada permanecem no controlador principal.
 */
export function criarNavegacao({ aoNavegar = () => {}, antesDeNavegar = () => true } = {}) {
    const botoes = [...document.querySelectorAll('[data-pagina]')];
    const paineis = [...document.querySelectorAll('[data-pagina-container]')];
    let paginaAtual = 'campanhas';

    let aguardandoConfirmacao = false;
    function mostrar(pagina) {
        for (const botao of botoes) {
            const ativo = botao.dataset.pagina === pagina;
            botao.classList.toggle('ativa', ativo);
            if (ativo) botao.setAttribute('aria-current', 'page');
            else botao.removeAttribute('aria-current');
        }
        for (const painel of paineis) painel.hidden = painel.dataset.paginaContainer !== pagina;
        paginaAtual = pagina;
        aoNavegar(pagina);
    }

    function abrir(pagina) {
        if (!PAGINAS.includes(pagina)) throw new Error('Área inexistente na Mesa do Mestre.');
        if (aguardandoConfirmacao) return;
        if (pagina === paginaAtual) { mostrar(pagina); return; }
        const permitido = antesDeNavegar(pagina, paginaAtual);
        if (permitido instanceof Promise) {
            aguardandoConfirmacao = true;
            return permitido.then(aceito => { if (aceito) mostrar(pagina); })
                .finally(() => { aguardandoConfirmacao = false; });
        }
        if (permitido) mostrar(pagina);
    }

    for (const botao of botoes) {
        botao.addEventListener('click', () => abrir(botao.dataset.pagina));
    }

    abrir(paginaAtual);
    return { abrir, get atual() { return paginaAtual; } };
}
