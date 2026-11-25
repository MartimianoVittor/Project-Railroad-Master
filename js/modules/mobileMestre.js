
/** Ícones exclusivos da barra inferior mobile, sem modificar o menu desktop. */
function prepararIcones(navegacao) {
    if (typeof document.createElementNS !== 'function') return;
    const icones = {
        'campanhas': '<path d="M5 21V5m0 0c6-4 8 4 14 0v11c-6 4-8-4-14 0"/>',
        'diario': '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v17H6a2 2 0 0 0 0 4h14"/><path d="M8 8h8M8 12h6"/>',
        'fichas': '<path d="M7 3h8l4 4v14H7zM15 3v5h4M10 12h6M10 16h6M4 7v14"/>',
        'npcs': '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M3 21h18"/>',
        'combate': '<path d="M4 4l16 16M15 4l5 5-11 11-5-5M15 4l-3 3M9 20l-3 2-4-4 2-3"/>',
        'viagem': '<circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z"/>',
        'utilitarios': '<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4l-3.1 3.1-3.5-3.5z"/>',
    };
    const ns = 'http://www.w3.org/2000/svg';
    for (const [pagina, desenho] of Object.entries(icones)) {
        const aba = navegacao.querySelector(`[data-pagina="${pagina}"]`);
        if (!aba || aba.querySelector('.rr-aba-icone')) continue;
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.7');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('rr-aba-icone');
        svg.innerHTML = desenho; // Trechos fixos deste módulo, sem conteúdo do usuário.
        aba.append(svg);
    }
}

/** Interações exclusivamente de apresentação na versão móvel.
 * Não altera o estado das campanhas, fichas ou dados persistidos.
 */
export function iniciarMobileMestre() {
    const navegacao = document.getElementById('navegacao-mobile-mestre');
    const quadroRolavel = document.querySelector('.quadro-viewport-mobile');
    if (!navegacao) return;
    prepararIcones(navegacao);

    const janelaMobile = window.matchMedia('(max-width: 900px)');
    function mostrarAbaAtiva() {
        if (!janelaMobile.matches || navegacao.hidden) return;
        const ativa = navegacao.querySelector('[data-pagina].ativa');
        if (!ativa) return;
        const destino = ativa.offsetLeft + ativa.offsetWidth / 2 - navegacao.clientWidth / 2;
        navegacao.scrollLeft = Math.max(0, destino);
    }
    navegacao.addEventListener('click', (evento) => {
        if (evento.target.closest('[data-pagina]')) requestAnimationFrame(mostrarAbaAtiva);
    });
    janelaMobile.addEventListener?.('change', mostrarAbaAtiva);
    mostrarAbaAtiva();

    if (!quadroRolavel) return;
    document.querySelectorAll('[data-quadro-mobile-deslocar]').forEach((botao) => {
        botao.addEventListener('click', () => {
            const direcao = Number(botao.dataset.quadroMobileDeslocar);
            if (!Number.isFinite(direcao)) return;
            quadroRolavel.scrollBy({ left: quadroRolavel.clientWidth * .7 * direcao, behavior: 'smooth' });
        });
    });
}
