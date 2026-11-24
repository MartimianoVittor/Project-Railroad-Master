import { elemento as criar } from '../core/dom.js?v=mesa-34';
import { MECANICAS, MECANICAS_POR_ID, CATEGORIAS_REGRAS, CONSULTAS_PADRAO } from '../modules/catalogoRegras.js?v=mesa-34';
import { encaixarCartoes, alturaInicialCartao, passoInteiro, MAX_LINHAS_GRADE, ESPACAMENTO_GRADE as GAP, MIN_LADO_CARTAO } from '../modules/gradeConsultas.js?v=mesa-34';
import { montarCartao, ajustarEscalaConteudo } from '../modules/utilitarios/cartao.js?v=mesa-34';
import { criarMedidorGrade } from '../modules/utilitarios/medidas.js?v=mesa-34';
import { copiarCartoes, paraCartoes, nomeSeguro, idNovo, MAX_CARTOES } from '../modules/utilitarios/consultas.js?v=mesa-34';
import { chaveConsultas, carregarConsultas, gravarConsultas } from '../services/consultasLocal.js?v=mesa-34';

function normalizar(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function armazenar() {
    try { return window.localStorage; } catch { return null; }
}

/** O estado das consultas é por conta e campanha, sem alteração nas tabelas do Supabase. */
export function criarControladorUtilitarios({ estado }) {
    let painel;
    let grade;
    let catalogo;
    let seletor;
    let nome;
    let pesquisa;
    let status;
    let excluir;
    let armazenamento = null;
    let chaveAtual = null;
    let salvas = [];
    let cartas = [];
    let selecionada = 'p:essenciais';
    let medidor;
    let exibidas = [];
    let iniciado = false;
    let medirAgendado = false;
    function informar(texto) { status.textContent = texto; }
    function persistir() {
        if (!chaveAtual) return false;
        try {
            gravarConsultas(armazenamento, chaveAtual, salvas, {
                id: selecionada, nome: nome.value, cartoes: cartas,
            });
            return true;
        } catch {
            informar('Não foi possível guardar as consultas neste navegador.');
            return false;
        }
    }
    function carregarContexto() {
        const chave = chaveConsultas(estado);
        if (chave === chaveAtual) return;
        chaveAtual = chave;
        const consultas = carregarConsultas(armazenamento, chave);
        salvas = consultas.salvas;
        cartas = consultas.atual.cartoes;
        selecionada = consultas.atual.id;
        nome.value = consultas.atual.nome;
        atualizarSeletores();
        renderizarTudo();
    }
    function atualizarContexto() { if (iniciado) carregarContexto(); }
    function atualizarSeletores() {
        const fragmento = document.createDocumentFragment();
        const option = (label, value) => { const el = criar('option', '', label);el.value = value;return el; };
        fragmento.append(option('— Rascunho atual —', 'rascunho'));
        const basicas = criar('optgroup');basicas.label = 'Consultas predefinidas';
        CONSULTAS_PADRAO.forEach((p) => basicas.append(option(p.nome, `p:${p.id}`)));
        fragmento.append(basicas);
        if (salvas.length) {
            const pessoais = criar('optgroup');pessoais.label = 'Minhas consultas';
            salvas.forEach((p) => pessoais.append(option(p.nome, p.id)));
            fragmento.append(pessoais);
        }
        seletor.replaceChildren(fragmento);
        seletor.value = [...seletor.options].some((o) => o.value === selecionada) ? selecionada : 'rascunho';
        excluir.disabled = !selecionada.startsWith('u:');
    }
    function escolher(id) {
        if (id === 'rascunho') { selecionada = 'rascunho'; atualizarSeletores(); persistir(); return; }
        const padrao = CONSULTAS_PADRAO.find((p) => `p:${p.id}` === id);
        const propria = salvas.find((p) => p.id === id);
        if (!padrao && !propria) return;
        const modelo = padrao ? paraCartoes(padrao.itens) : copiarCartoes(propria.cartoes);
        cartas = modelo;
        nome.value = padrao ? padrao.nome : propria.nome;
        selecionada = id;
        atualizarSeletores();
        renderizarTudo();
        if (!persistir()) return;
        informar(`Consulta “${nome.value}” carregada. Alterações só substituem a consulta salva ao clicar em Salvar.`);
    }
    function salvar() {
        const titulo = nomeSeguro(nome.value);
        if (!titulo) { nome.focus();informar('Informe um nome para salvar a consulta.');return; }
        const idExistente = selecionada.startsWith('u:') ? salvas.findIndex((p) => p.id === selecionada) : -1;
        if (idExistente >= 0) salvas[idExistente] = { id:selecionada, nome:titulo, cartoes:copiarCartoes(cartas) };
        else {
            selecionada = idNovo();
            salvas.push({ id:selecionada, nome:titulo, cartoes:copiarCartoes(cartas) });
        }
        atualizarSeletores();
        if (!persistir()) return;
        informar(`Consulta “${titulo}” salva neste navegador para a campanha atual.`);
    }
    function limpar() {
        if (cartas.length && !window.confirm('Limpar os cartões do quadro? Consultas já salvas não serão apagadas.')) return;
        cartas = [];
        renderizarTudo();
        if (!persistir()) return;
        informar('Quadro limpo. As consultas salvas continuam disponíveis.');
    }
    function excluirConsulta() {
        const atual = salvas.find((p) => p.id === selecionada);
        if (!atual) return;
        if (!window.confirm(`Excluir a consulta salva “${atual.nome}”?`)) return;
        salvas = salvas.filter((p) => p.id !== atual.id);
        selecionada = 'rascunho';
        atualizarSeletores();
        if (!persistir()) return;
        informar(`Consulta “${atual.nome}” excluída. Os cartões atuais continuam no quadro.`);
    }
    function marcar(id) {
        const { colunas } = medidor;
        const indice = cartas.findIndex((p) => p.id === id);
        if (indice >= 0) cartas.splice(indice, 1);
        else {
            if (cartas.length >= MAX_CARTOES) { informar('Limite de cartões atingido.');return; }
            cartas.push({ id, x:0, y:0, w:MIN_LADO_CARTAO, h:MIN_LADO_CARTAO, manual:false, posicaoManual:false });
            // A nova peça entra na primeira lacuna disponível, sem mover as peças existentes.
            cartas = encaixarCartoes(cartas, colunas);
        }
        renderizarTudo();
        persistir();
    }
    function renderizarCatalogo() {
        const filtro = normalizar(pesquisa.value);
        const selecionados = new Set(cartas.map((p) => p.id));
        const fragmento = document.createDocumentFragment();
        let total = 0;
        for (const categoria of CATEGORIAS_REGRAS) {
            const itens = MECANICAS.filter((p) => p.categoria === categoria &&
                (!filtro || normalizar([p.titulo,p.resumo,p.categoria,p.pagina,...p.itens].join(' ')).includes(filtro)));
            if (!itens.length) continue;
            fragmento.append(criar('h4', 'util-categoria-titulo', categoria));
            for (const p of itens) {
                total++;
                const selecionado = selecionados.has(p.id);
                const item = criar('article', `util-mecanica${selecionado ? ' adicionada' : ''}`);
                const info = criar('div');
                info.append(criar('h4', '', p.titulo));
                const medidas = exibidas.find((peca) => peca.id === p.id) || medidor.tamanhoPreferido(p);
                const metadados = criar('p', 'util-mecanica-metadados');
                metadados.append(criar('span', '', `Livro 1.0 · pág. ${p.pagina}`));
                const tamanho = criar('span', 'util-mecanica-tamanho', `${medidas.w}×${medidas.h}`);
                tamanho.title = `Cartão de ${medidas.w} colunas por ${medidas.h} linhas quadradas`;
                metadados.append(tamanho);
                info.append(metadados);
                const botao = criar('button', 'util-mecanica-marcar', '✓');
                botao.type = 'button';
                botao.dataset.regra = p.id;
                botao.setAttribute('aria-label', `${selecionado ? 'Remover' : 'Adicionar'} ${p.titulo} ${selecionado ? 'do' : 'ao'} quadro`);
                botao.setAttribute('aria-pressed', String(selecionado));
                botao.title = selecionado ? 'Remover do quadro' : 'Adicionar ao quadro';
                item.append(info,botao);
                fragmento.append(item);
            }
        }
        if (!total) fragmento.append(criar('p', 'util-resultado-vazio rr-estado-vazio rr-estado-vazio--compacto', 'Nenhuma mecânica encontrada. Tente outra palavra.'));
        catalogo.replaceChildren(fragmento);
    }
    function ajustarEscalasQuadro() {
        for (const cartao of grade.querySelectorAll('.util-cartao.util-tamanho-manual'))
            ajustarEscalaConteudo(cartao);
    }

    function renderizarQuadro() {
        if (!medidor.configurarLargura()) return;
        const { ladoCelula, colunas } = medidor;
        const dimensionadas = cartas.map(medidor.dimensionarCartao);
        const presetAutomatico = selecionada.startsWith('p:') && dimensionadas.every(p => !p.posicaoManual && !p.ajusteManual);
        // Peças maiores primeiro, preenchendo as lacunas com as menores.
        if (presetAutomatico) dimensionadas.sort((a, b) => b.h - a.h || b.w - a.w);
        exibidas = encaixarCartoes(dimensionadas, colunas);
        // Guarda a disposição atual, sem perder a preferência de redimensionamento.
        cartas = exibidas.map((p) => ({ ...p }));
        const fragmento = document.createDocumentFragment();
        if (!exibidas.length) {
            const vazio = criar('div', 'util-vazio rr-estado-vazio');
            vazio.append(criar('strong', '', 'Seu quadro está vazio'), document.createTextNode('Marque ✓ em qualquer mecânica à esquerda ou selecione uma consulta predefinida na barra superior.'));
            fragmento.append(vazio);
        }
        for (const pos of exibidas) {
            const regra = MECANICAS_POR_ID.get(pos.id);
            if (regra) fragmento.append(montarCartao(pos, regra));
        }
        const rolagemAnterior = grade.scrollTop;
        grade.replaceChildren(fragmento);
        grade.scrollTop = rolagemAnterior;

        // Confere o conteúdo após a disposição real. Evita cortes por diferenças de arredondamento.
        if (!medirAgendado && exibidas.length) {
            medirAgendado = true;
            requestAnimationFrame(() => {
                medirAgendado = false;
                if (!painel.isConnected || painel.hidden) return;
                let alterou = false;
                for (const elemento of grade.querySelectorAll('.util-cartao')) {
                    const corpo = elemento.querySelector('.util-cartao-corpo');
                    const tabela = elemento.querySelector('.util-tabela-rolagem');
                    // Uma tabela flexível pode esconder linhas dentro de seu próprio
                    // contêiner sem aumentar o scrollHeight do corpo externo.
                    const excesso = Math.max(
                        corpo ? corpo.scrollHeight - corpo.clientHeight : 0,
                        tabela ? tabela.scrollHeight - tabela.clientHeight : 0
                    );
                    if (excesso <= 2) continue;
                    const peca = cartas.find((p) => p.id === elemento.dataset.id);
                    if (!peca) continue;
                    const somar = Math.ceil((excesso + GAP + 2) / (ladoCelula + GAP));
                    const altura = peca.ajusteManual
                        ? passoInteiro(peca.h + somar, MIN_LADO_CARTAO,
                            Math.max(peca.h, linhasVisiveisAbaixo(peca)))
                        : alturaInicialCartao(peca.h + somar);
                    if (altura <= peca.h && peca.ajusteManual) {
                        // Evita repetidas tentativas de expansão para fora do quadro.
                        elemento.classList.add('util-conteudo-limitado');
                        continue;
                    }
                    medidor.registrarAltura(peca.id, peca.w, altura);
                    if (peca.ajusteManual) peca.h = altura;
                    // Não converte um ajuste de segurança em redimensionamento do usuário.
                    alterou = true;
                }
                if (alterou) { renderizarQuadro();renderizarCatalogo();persistir(); }
                else ajustarEscalasQuadro();
            });
        }
    }
    function renderizarTudo() { renderizarQuadro();renderizarCatalogo(); }
    /** Retorna a quantidade de linhas ainda visíveis abaixo do início do cartão.
     * O quadro possui rolagem vertical: a borda inferior considerada é a
     * do viewport interno, e não a extremidade do conteúdo rolável. */
    function linhasVisiveisAbaixo(base) {
        const { ladoCelula } = medidor;
        if (!grade || !ladoCelula) return MAX_LINHAS_GRADE;
        const estilo = getComputedStyle(grade);
        const superior = parseFloat(estilo.paddingTop) || 0;
        const inferior = parseFloat(estilo.paddingBottom) || 0;
        const passo = ladoCelula + GAP;
        const topo = superior + base.y * passo - grade.scrollTop;
        const disponivel = grade.clientHeight - inferior - topo;
        const alturaTotalVisivel = grade.clientHeight - superior - inferior;
        const limiteDaJanela = Math.max(MIN_LADO_CARTAO,
            Math.floor((alturaTotalVisivel + GAP + .5) / passo));
        return Math.max(0, Math.min(limiteDaJanela,
            Math.floor((disponivel + GAP + .5) / passo)));
    }
    /** O cartão não muda de posição para conseguir crescer: as alças param
     * na borda direita e inferior visível do quadro. Passos ímpares continuam válidos. */
    function tamanhoArrastado(base, modo, deltaX, deltaY) {
        const { ladoCelula, colunas } = medidor;
        const passo = (valor) => Math.round(valor / (ladoCelula + GAP));
        const maximoLargura = Math.max(MIN_LADO_CARTAO, colunas - base.x);
        const maximoAltura = Math.max(base.h, linhasVisiveisAbaixo(base));
        const w = modo === 'altura' ? base.w
            : passoInteiro(base.w + passo(deltaX), MIN_LADO_CARTAO, maximoLargura);
        const regra = MECANICAS_POR_ID.get(base.id);
        const minimo = Math.max(MIN_LADO_CARTAO, medidor.minimoDeAltura(regra, w));
        // Se estreitar exigiria mais linhas do que cabem, não aplica o ajuste.
        if (minimo > maximoAltura) return { w:base.w, h:base.h };
        const hDesejado = modo === 'largura' ? base.h : base.h + passo(deltaY);
        const h = passoInteiro(Math.max(minimo, hDesejado), MIN_LADO_CARTAO,
            Math.min(MAX_LINHAS_GRADE, maximoAltura));
        return { w, h };
    }
    function confirmarTamanho(id, w, h) {
        const { colunas } = medidor;
        const atual = cartas.find((p) => p.id === id);
        const pos = exibidas.find((p) => p.id === id);
        if (!atual || !pos) return;
        const regra = MECANICAS_POR_ID.get(id);
        const maximoLargura = Math.max(MIN_LADO_CARTAO, colunas - pos.x);
        const largura = passoInteiro(w, MIN_LADO_CARTAO, maximoLargura);
        const minimo = Math.max(MIN_LADO_CARTAO, medidor.minimoDeAltura(regra, largura));
        const maximoAltura = Math.max(pos.h, linhasVisiveisAbaixo(pos));
        if (minimo > maximoAltura) return;
        // Mantém a origem do cartão: não o desloca para acomodar crescimento.
        atual.x = pos.x;
        atual.y = pos.y;
        atual.w = largura;
        atual.h = passoInteiro(Math.max(minimo, h), MIN_LADO_CARTAO,
            Math.min(MAX_LINHAS_GRADE, maximoAltura));
        atual.manual = true;
        atual.ajusteManual = true;
        atual.posicaoManual = true;
        cartas = encaixarCartoes(cartas, colunas, id);
        renderizarQuadro();
        renderizarCatalogo();
        persistir();
    }
    function iniciarRedimensionamento(evento) {
        const alca = evento.target.closest('[data-redimensionar]');
        if (!alca || (evento.pointerType === 'mouse' && evento.button !== 0)) return false;
        const id = alca.dataset.cartao;
        const base = exibidas.find((p) => p.id === id);
        const item = alca.closest('.util-cartao');
        if (!base || !item) return false;
        evento.preventDefault();
        evento.stopPropagation();
        const inicio = { x:evento.clientX, y:evento.clientY };
        const modo = alca.dataset.redimensionar;
        let novo = { w:base.w, h:base.h };
        const etiqueta = item.querySelector('.util-tamanho-durante-ajuste');
        let previaPendente = false;
        alca.setPointerCapture(evento.pointerId);
        item.classList.add('redimensionando', 'util-tamanho-manual');
        const mover = (ev) => {
            if (ev.pointerId !== evento.pointerId) return;
            novo = tamanhoArrastado(base, modo, ev.clientX - inicio.x, ev.clientY - inicio.y);
            // Prévia visível. A grade definitiva é recalculada apenas ao soltar.
            item.style.width = `${medidor.larguraEmCelulas(novo.w)}px`;
            item.style.height = `${medidor.larguraEmCelulas(novo.h)}px`;
            if (etiqueta) etiqueta.textContent = `${novo.w}×${novo.h}`;
            if (!previaPendente) {
                previaPendente = true;
                requestAnimationFrame(() => {
                    previaPendente = false;
                    if (item.isConnected) ajustarEscalaConteudo(item);
                });
            }
        };
        const limpar = (ev) => {
            if (ev.pointerId !== evento.pointerId) return false;
            alca.removeEventListener('pointermove', mover);
            alca.removeEventListener('pointerup', concluir);
            alca.removeEventListener('pointercancel', cancelar);
            if (alca.hasPointerCapture(ev.pointerId)) alca.releasePointerCapture(ev.pointerId);
            item.classList.remove('redimensionando');
            item.style.removeProperty('--util-escala-conteudo');
            item.style.width = '';
            item.style.height = '';
            return true;
        };
        const concluir = (ev) => {
            if (!limpar(ev)) return;
            if (novo.w !== base.w || novo.h !== base.h) confirmarTamanho(id, novo.w, novo.h);
        };
        const cancelar = (ev) => { limpar(ev); };
        alca.addEventListener('pointermove', mover);
        alca.addEventListener('pointerup', concluir);
        alca.addEventListener('pointercancel', cancelar);
        return true;
    }
    function iniciarArraste(evento) {
        const { ladoCelula, colunas } = medidor;
        if (evento.button !== 0 && evento.pointerType === 'mouse') return;
        if (evento.target.closest('[data-redimensionar], [data-acao]')) return;
        const cabecalho = evento.target.closest('.util-cartao-cabecalho');
        if (!cabecalho) return;
        const botao = cabecalho.querySelector('[data-arrastar]');
        if (!botao) return;
        const item = cabecalho.closest('.util-cartao');
        const id = botao.dataset.arrastar;
        const base = exibidas.find((p) => p.id === id);
        if (!item || !base) return;
        evento.preventDefault();
        const inicio = { x:evento.clientX, y:evento.clientY };
        let deltaX = 0;let deltaY = 0;
        cabecalho.setPointerCapture(evento.pointerId);
        item.classList.add('arrastando');
        const mover = (ev) => {
            if (ev.pointerId !== evento.pointerId) return;
            deltaX = ev.clientX - inicio.x;
            deltaY = ev.clientY - inicio.y;
            item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        };
        const concluir = (ev) => {
            if (ev.pointerId !== evento.pointerId) return;
            cabecalho.removeEventListener('pointermove', mover);
            cabecalho.removeEventListener('pointerup', concluir);
            cabecalho.removeEventListener('pointercancel', cancelar);
            if (cabecalho.hasPointerCapture(ev.pointerId)) cabecalho.releasePointerCapture(ev.pointerId);
            const larguraUtil = ladoCelula + GAP;
            const x = Math.max(0, Math.min(colunas - base.w, base.x + Math.round(deltaX / larguraUtil)));
            const y = Math.max(0, Math.min(1500, base.y + Math.round(deltaY / (ladoCelula + GAP))));
            const editado = cartas.find((p) => p.id === id);
            if (editado) {
                editado.x = x;editado.y = y;editado.posicaoManual = true;
                cartas = encaixarCartoes(cartas, colunas, id);
            }
            renderizarQuadro();persistir();
        };
        const cancelar = (ev) => {
            if (ev.pointerId !== evento.pointerId) return;
            cabecalho.removeEventListener('pointermove', mover);
            cabecalho.removeEventListener('pointerup', concluir);
            cabecalho.removeEventListener('pointercancel', cancelar);
            item.style.transform = '';
            item.classList.remove('arrastando');
        };
        cabecalho.addEventListener('pointermove', mover);
        cabecalho.addEventListener('pointerup', concluir);
        cabecalho.addEventListener('pointercancel', cancelar);
    }
    function iniciarEventos() {
        if (iniciado) return;
        painel = document.getElementById('pagina-utilitarios');
        if (!painel) return;
        grade = document.getElementById('util-grade');
        catalogo = document.getElementById('util-lista-mecanicas');
        seletor = document.getElementById('util-consulta-salva');
        nome = document.getElementById('util-consulta-nome');
        pesquisa = document.getElementById('util-busca');
        status = document.getElementById('util-status');
        excluir = document.getElementById('util-excluir');
        medidor = criarMedidorGrade(painel, grade);
        armazenamento = armazenar();
        iniciado = true;
        pesquisa.addEventListener('input', renderizarCatalogo);
        seletor.addEventListener('change', () => escolher(seletor.value));
        document.getElementById('util-salvar').addEventListener('click', salvar);
        document.getElementById('util-limpar').addEventListener('click', limpar);
        excluir.addEventListener('click', excluirConsulta);
        catalogo.addEventListener('click', (e) => {
            const marcarBotao = e.target.closest('button[data-regra]');
            if (marcarBotao) marcar(marcarBotao.dataset.regra);
        });
        grade.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-acao]');
            if (!b) return;
            if (b.dataset.acao === 'remover') marcar(b.dataset.cartao);
        });
        grade.addEventListener('pointerdown', (evento) => {
            if (!iniciarRedimensionamento(evento)) iniciarArraste(evento);
        });
        // Alternativa pelo teclado: setas redimensionam as alças e movem pelo cabeçalho.
        grade.addEventListener('keydown', (evento) => {
            const { ladoCelula, colunas } = medidor;
            const alca = evento.target.closest('[data-redimensionar]');
            if (alca && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(evento.key)) {
                evento.preventDefault();
                const id = alca.dataset.cartao;
                const base = exibidas.find((p) => p.id === id);
                if (!base) return;
                const horizontal = ['largura', 'ambos'].includes(alca.dataset.redimensionar);
                const vertical = ['altura', 'ambos'].includes(alca.dataset.redimensionar);
                const dx = horizontal ? (evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0) : 0;
                const dy = vertical ? (evento.key === 'ArrowDown' ? 1 : evento.key === 'ArrowUp' ? -1 : 0) : 0;
                if (!dx && !dy) return;
                const novo = tamanhoArrastado(base, alca.dataset.redimensionar,
                    dx * (ladoCelula + GAP), dy * (ladoCelula + GAP));
                confirmarTamanho(id, novo.w, novo.h);
                grade.querySelector(`[data-redimensionar="${alca.dataset.redimensionar}"][data-cartao="${id}"]`)?.focus({ preventScroll:true });
                return;
            }
            const botao = evento.target.closest('[data-arrastar]');
            if (!botao || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(evento.key)) return;
            const id = botao.dataset.arrastar;
            const atual = cartas.find((p) => p.id === id);
            const pos = exibidas.find((p) => p.id === id);
            if (!atual || !pos) return;
            evento.preventDefault();
            atual.x = Math.max(0, Math.min(colunas - pos.w, pos.x + (evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0)));
            atual.y = Math.max(0, pos.y + (evento.key === 'ArrowDown' ? 1 : evento.key === 'ArrowUp' ? -1 : 0));
            atual.posicaoManual = true;
            cartas = encaixarCartoes(cartas, colunas, id);
            renderizarQuadro();
            persistir();
            grade.querySelector(`[data-arrastar="${id}"]`)?.focus();
        });
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
            if (painel.hidden) return;
            if (medidor.larguraMudou()) renderizarTudo();
        }) : null;
        observer?.observe(grade);
        carregarContexto();
    }
    function atualizar() {
        if (!iniciado) return;
        carregarContexto();
        // A aba pode estar oculta durante a montagem; medir novamente quando exibida.
        renderizarTudo();
    }
    return { iniciarEventos, atualizar, atualizarContexto };
}
