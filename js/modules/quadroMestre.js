import { confirmar, solicitar, informar } from '../core/dialogos.js?v=mesa-39';
import { imagemSegura } from '../services/imagensStorage.js?v=mesa-39';
/** Quadro do Mestre, baseado nas ferramentas do Quadro do Railroad Jogador.
 * Desenho livre, borracha, textos, imagens, movimentação e redimensionamento.
 * Cada sessão recebe seu próprio estado, coletado somente pelo controlador.
 */
export function iniciarQuadroMestre({ aoAlterar = () => {} } = {}) {
    const zona = document.getElementById('zona-quadro-mestre');
    const canvas = document.getElementById('quadro-mestre');
    const contexto = canvas.getContext('2d');
    const seletorCor = document.getElementById('cor-quadro-mestre');
    const upload = document.getElementById('imagem-quadro-mestre');
    const ferramentas = [...document.querySelectorAll('[data-ferramenta-quadro]')];
    const limpar = document.getElementById('limpar-quadro-mestre');
    let modo = 'lapis';
    let selecionado = null;
    let ativo = false;
    let desenhando = false;
    let ultima = null;
    let versaoImagem = 0;
    let carregandoImagem = null;
    let fonteOriginal = null;
    let desenhoModificado = false;
    let instantaneoDesenho = null;
    let temDesenho = false;

    canvas.width = 1200;
    canvas.height = 760;

    function selecionar(item) {
        selecionado?.classList.remove('selecionado');
        selecionado = item;
        selecionado?.classList.add('selecionado');
    }
    function escolherFerramenta(nova) {
        modo = nova;
        selecionar(null);
        zona.classList.toggle('modo-mover-ativo', modo === 'mover');
        canvas.style.cursor = modo === 'texto' ? 'text' : modo === 'mover' ? 'default' : 'crosshair';
        ferramentas.forEach((botao) => {
            const selecionada = botao.dataset.ferramentaQuadro === modo;
            botao.classList.toggle('ativo', selecionada);
            botao.setAttribute('aria-pressed', String(selecionada));
        });
    }
    function posicao(evento) {
        const r = zona.getBoundingClientRect();
        return { x: Math.max(0, Math.min(100, (evento.clientX - r.left) / r.width * 100)),
            y: Math.max(0, Math.min(100, (evento.clientY - r.top) / r.height * 100)) };
    }
    function posicaoCanvas(evento) {
        const r = canvas.getBoundingClientRect();
        return { x: (evento.clientX - r.left) / r.width * canvas.width,
            y: (evento.clientY - r.top) / r.height * canvas.height };
    }
    function configurarItem(container) {
        const alca = document.createElement('span');
        alca.className = 'alca-redimensionar';
        alca.setAttribute('aria-label', 'Redimensionar');
        container.append(alca);
        let interacao = null;
        function iniciar(evento, redimensionar) {
            if (!ativo || modo !== 'mover' || evento.button !== 0) return;
            evento.preventDefault();
            evento.stopPropagation();
            selecionar(container);
            interacao = {
                id: evento.pointerId,
                x: evento.clientX, y: evento.clientY,
                esquerda: parseFloat(container.style.left), topo: parseFloat(container.style.top),
                largura: parseFloat(container.style.width),
                tamanho: parseFloat(container.querySelector('.texto-conteudo')?.style.fontSize) || 18,
                redimensionar,
            };
            evento.currentTarget.setPointerCapture(evento.pointerId);
        }
        container.addEventListener('pointerdown', (e) => { if (e.target !== alca) iniciar(e, false); });
        alca.addEventListener('pointerdown', (e) => iniciar(e, true));
        function mover(e) {
            if (!interacao || e.pointerId !== interacao.id) return;
            const dx = (e.clientX - interacao.x) / Math.max(1, zona.clientWidth) * 100;
            const dy = (e.clientY - interacao.y) / Math.max(1, zona.clientHeight) * 100;
            if (!interacao.redimensionar) {
                container.style.left = `${Math.max(0, Math.min(100 - interacao.largura, interacao.esquerda + dx))}%`;
                container.style.top = `${Math.max(0, Math.min(95, interacao.topo + dy))}%`;
            } else if (container.dataset.tipo === 'imagem') {
                container.style.width = `${Math.max(5, Math.min(100 - interacao.esquerda, interacao.largura + dx))}%`;
            } else {
                const texto = container.querySelector('.texto-conteudo');
                texto.style.fontSize = `${Math.max(10, Math.min(90, interacao.tamanho + dx * 1.5))}px`;
            }
        }
        function finalizar(e) {
            if (!interacao || e.pointerId !== interacao.id) return;
            interacao = null;
            aoAlterar();
        }
        for (const alvo of [container, alca]) {
            alvo.addEventListener('pointermove', mover);
            alvo.addEventListener('pointerup', finalizar);
            alvo.addEventListener('pointercancel', finalizar);
        }
    }
    function criarItem(dados, notificar = true) {
        const container = document.createElement('div');
        container.className = 'item-movel';
        container.dataset.tipo = dados.tipo;
        container.style.left = `${dados.x ?? 5}%`;
        container.style.top = `${dados.y ?? 5}%`;
        container.style.width = `${dados.largura ?? (dados.tipo === 'imagem' ? 30 : 35)}%`;
        if (dados.tipo === 'texto') {
            const texto = document.createElement('div');
            texto.className = 'texto-conteudo';
            texto.textContent = dados.texto ?? '';
            texto.style.color = dados.cor || '#3d2314';
            texto.style.fontSize = `${dados.tamanho ?? 18}px`;
            container.append(texto);
        } else {
            const img = document.createElement('img');
            img.className = 'imagem-conteudo';
            img.src = dados.src;
            img.alt = 'Imagem inserida no quadro de ideias';
            img.draggable = false;
            container.append(img);
        }
        zona.append(container);
        configurarItem(container);
        if (notificar) {
            escolherFerramenta('mover');
            selecionar(container);
            aoAlterar();
        }
        return container;
    }
    function limparTudo(notificar = true) {
        versaoImagem++;
        carregandoImagem = null;
        fonteOriginal = null;
        desenhoModificado = false;
        instantaneoDesenho = null;
        temDesenho = false;
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        zona.querySelectorAll('.item-movel').forEach((item) => item.remove());
        selecionar(null);
        if (notificar) aoAlterar();
    }
    function restaurar(quadro = {}) {
        limparTudo(false);
        const versao = versaoImagem;
        const desenho = typeof quadro.desenhoCanvas === 'string' ? quadro.desenhoCanvas : '';
        if (desenho) {
            temDesenho = true;
            carregandoImagem = desenho;
            fonteOriginal = desenho;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (versao !== versaoImagem) return;
                contexto.clearRect(0, 0, canvas.width, canvas.height);
                contexto.drawImage(img, 0, 0, canvas.width, canvas.height);
                carregandoImagem = null;
            };
            img.onerror = () => { if (versao === versaoImagem) carregandoImagem = null; };
            img.src = desenho;
        }
        for (const item of quadro.itensQuadro || []) {
            if (item?.tipo === 'texto' && typeof item.texto === 'string') criarItem(item, false);
            else if (item?.tipo === 'imagem' && imagemSegura(item.src)) criarItem(item, false);
        }
        escolherFerramenta('lapis');
    }
    function coletar() {
        const itensQuadro = [...zona.querySelectorAll('.item-movel')].map((container) => {
            const base = {
                tipo: container.dataset.tipo,
                x: parseFloat(container.style.left) || 0,
                y: parseFloat(container.style.top) || 0,
                largura: parseFloat(container.style.width) || 25,
            };
            if (base.tipo === 'texto') {
                const texto = container.querySelector('.texto-conteudo');
                return { ...base, texto: texto.textContent, cor: texto.style.color, tamanho: parseFloat(texto.style.fontSize) || 18 };
            }
            return { ...base, src: container.querySelector('img')?.getAttribute('src') || '' };
        });
        // Editar textos, imagens ou suas posições não altera os pixels do desenho.
        // Reutilizar a mesma fonte impede uploads novos a cada salvamento do Diário.
        if (desenhoModificado && !instantaneoDesenho) {
            instantaneoDesenho = canvas.toDataURL('image/png');
        }
        return {
            desenhoCanvas: carregandoImagem || fonteOriginal || instantaneoDesenho || (temDesenho ? canvas.toDataURL('image/png') : ''),
            itensQuadro,
        };
    }
    function habilitar(valor) {
        ativo = Boolean(valor);
        [...ferramentas, limpar, seletorCor, upload].forEach((item) => { item.disabled = !ativo; });
        zona.classList.toggle('quadro-inativo', !ativo);
    }
    ferramentas.forEach((botao) => botao.addEventListener('click', () => escolherFerramenta(botao.dataset.ferramentaQuadro)));
    limpar.addEventListener('click', async () => {
        if (await confirmar('Limpar todo o quadro desta sessão? A alteração só será definitiva depois de salvar.')) limparTudo();
    });
    canvas.addEventListener('pointerdown', async (evento) => {
        if (!ativo || carregandoImagem || evento.button !== 0) return;
        if (modo === 'mover') { selecionar(null); return; }
        if (modo === 'texto') {
            const texto = await solicitar('Texto para o quadro:');
            if (texto?.trim()) criarItem({ tipo: 'texto', texto: texto.trim().slice(0, 2000), cor: seletorCor.value, ...posicao(evento) });
            return;
        }
        desenhando = true;
        fonteOriginal = null;
        desenhoModificado = true;
        instantaneoDesenho = null;
        temDesenho = true;
        ultima = posicaoCanvas(evento);
        canvas.setPointerCapture(evento.pointerId);
        contexto.beginPath();
        contexto.moveTo(ultima.x, ultima.y);
    });
    canvas.addEventListener('pointermove', (evento) => {
        if (!desenhando || !ativo) return;
        const ponto = posicaoCanvas(evento);
        contexto.strokeStyle = modo === 'borracha' ? '#fcf8f2' : seletorCor.value;
        contexto.lineWidth = modo === 'borracha' ? 24 : 4;
        contexto.lineJoin = 'round';
        contexto.lineCap = 'round';
        contexto.lineTo(ponto.x, ponto.y);
        contexto.stroke();
        ultima = ponto;
    });
    const finalizar = () => {
        if (!desenhando) return;
        desenhando = false;
        contexto.closePath();
        aoAlterar();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((tipo) => canvas.addEventListener(tipo, finalizar));
    async function inserirImagem(arquivo, ponto = { x: 8, y: 8 }) {
        if (!ativo || !arquivo?.type?.startsWith('image/')) return;
        if (arquivo.size > 12 * 1024 * 1024) throw new Error('Use imagens de até 12 MB.');
        const versaoDaSessao = versaoImagem;
        const url = URL.createObjectURL(arquivo);
        try {
            const imagem = new Image();
            await new Promise((resolve, reject) => {
                imagem.onload = resolve;
                imagem.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
                imagem.src = url;
            });
            const escala = Math.min(1, 1280 / imagem.naturalWidth, 960 / imagem.naturalHeight);
            const copia = document.createElement('canvas');
            copia.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
            copia.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
            copia.getContext('2d').drawImage(imagem, 0, 0, copia.width, copia.height);
            // Não insere uma imagem na sessão errada após troca de campanha/sessão.
            if (versaoDaSessao !== versaoImagem || !ativo) return;
            criarItem({ tipo: 'imagem', src: copia.toDataURL('image/jpeg', .75), ...ponto, largura: 34 });
        } finally { URL.revokeObjectURL(url); }
    }
    upload.addEventListener('change', () => {
        const arquivo = upload.files?.[0];
        upload.value = '';
        if (arquivo) void inserirImagem(arquivo).catch((erro) => void informar(erro.message));
    });
    zona.addEventListener('dragover', (e) => { if (ativo && e.dataTransfer?.types.includes('Files')) e.preventDefault(); });
    zona.addEventListener('drop', (e) => {
        if (!ativo || !e.dataTransfer?.files?.length) return;
        e.preventDefault();
        void inserirImagem(e.dataTransfer.files[0], posicao(e)).catch((erro) => void informar(erro.message));
    });
    document.addEventListener('paste', (e) => {
        if (!ativo || document.getElementById('pagina-diario').hidden || e.target.closest('input,textarea,[contenteditable="true"]')) return;
        const arquivo = [...(e.clipboardData?.items || [])].find((item) => item.type.startsWith('image/'))?.getAsFile();
        if (arquivo) { e.preventDefault(); void inserirImagem(arquivo).catch((erro) => void informar(erro.message)); }
    });
    document.addEventListener('keydown', (e) => {
        if (!ativo || document.getElementById('pagina-diario').hidden || modo !== 'mover' || !selecionado) return;
        if (e.target.closest('input,textarea,[contenteditable="true"]')) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            selecionado.remove();
            selecionar(null);
            aoAlterar();
        }
    });
    habilitar(false);
    escolherFerramenta('lapis');
    return { coletar, restaurar, habilitar };
}
