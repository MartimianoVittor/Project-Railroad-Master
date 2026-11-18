import { criarParteFicha, PARTES_FICHA } from '../modules/visualizarFicha.js';
import { mostrarAviso } from '../core/feedback.js';
import { porId, elemento, mensagemLista } from '../core/dom.js';

/**
 * Seleção individual (três colunas) e comparação horizontal (uma parte de cada ficha).
 * Apenas envios aceitos ou pendentes são consultáveis; a autorização real é da RPC.
 */
export function criarControladorFichas(contexto) {
    const { estado } = contexto;
    let campanhaAnterior = null;
    let fichaSelecionada = '';
    let parteComparada = null;

    function fichasDisponiveis() {
        const ids = new Set();
        return estado.envios.filter((envio) => {
            if (!['pendente', 'aprovada'].includes(envio.status) || !envio.ficha_id
                || ids.has(envio.ficha_id)) return false;
            ids.add(envio.ficha_id);
            return true;
        });
    }

    function nomeDoPersonagem(envio) {
        const participante = (estado.participantes ?? []).find(
            (item) => item.envio_id === envio.envio_id);
        return participante?.personagem_nome || envio.titulo || 'Personagem sem nome';
    }

    function atualizarBotoes() {
        for (const botao of document.querySelectorAll('[data-comparar-ficha]')) {
            botao.setAttribute('aria-pressed', String(botao.dataset.compararFicha === parteComparada));
        }
    }

    function mostrarMensagem(mensagem) {
        const area = porId('conteudo-fichas');
        area.className = 'conteudo-fichas';
        area.replaceChildren(elemento('p', 'estado-consulta-fichas', mensagem));
        porId('quadro-fichas').setAttribute('aria-busy', 'false');
    }

    function limparVisualizacao() {
        fichaSelecionada = '';
        parteComparada = null;
        campanhaAnterior = estado.campanhaId;
        estado.versaoFicha++;
        porId('seletor-personagem').value = '';
        atualizarBotoes();
        mostrarMensagem('Selecione um personagem ou escolha uma das comparações acima.');
    }

    function listarEnvios() {
        if (campanhaAnterior !== estado.campanhaId) limparVisualizacao();

        const seletor = porId('seletor-personagem');
        const fichas = fichasDisponiveis();
        if (!fichas.some((envio) => envio.ficha_id === fichaSelecionada)) {
            fichaSelecionada = '';
        }

        seletor.replaceChildren();
        const inicial = elemento('option', '', 'Selecione um personagem');
        inicial.value = '';
        seletor.append(inicial);
        for (const envio of fichas) {
            const opcao = elemento('option', '', nomeDoPersonagem(envio));
            opcao.value = envio.ficha_id;
            if (envio.status === 'pendente') opcao.textContent += ' · aguardando aprovação';
            seletor.append(opcao);
        }
        seletor.value = fichaSelecionada;
        seletor.disabled = !fichas.length;
        for (const botao of document.querySelectorAll('[data-comparar-ficha]')) {
            botao.disabled = !fichas.length;
        }

        listarCombatentes();
        if (estado.navegacao?.atual === 'fichas') void atualizarVisualizacao();
    }

    function listarCombatentes() {
        const lista = porId('lista-combatentes');
        lista.replaceChildren();
        const aprovados = estado.envios.filter((envio) => envio.status === 'aprovada');

        for (const envio of aprovados) {
            const linha = elemento('li', 'registro');
            const informacoes = elemento('div', 'registro-info');
            informacoes.append(
                elemento('strong', '', nomeDoPersonagem(envio)),
                elemento('small', '', `Jogador: ${envio.jogador_id}`),
            );
            linha.append(informacoes, elemento('span', 'selo-status status-aprovada', 'Na campanha'));
            lista.append(linha);
        }

        if (!aprovados.length) mensagemLista(lista, estado.campanhaId
            ? 'Quando você aprovar fichas, os personagens aparecerão aqui para os futuros controles de combate.'
            : 'Selecione uma campanha para preparar os futuros combates.');
    }

    async function decidirFicha(envio, aprovar) {
        if (envio.status !== 'pendente'
            || !estado.envios.some((item) => item.envio_id === envio.envio_id)) return;
        await estado.repositorio.decidirEnvio(envio.envio_id, aprovar);
        await contexto.campanhas.atualizarConteudoCampanha();
        mostrarAviso(aprovar ? 'Ficha aprovada para a campanha.' : 'Ficha recusada. O acesso de leitura foi retirado.');
    }

    async function removerFicha(envio) {
        if (!estado.envios.some((item) => item.envio_id === envio.envio_id)) return;
        if (!confirm(`Retirar “${envio.titulo || 'esta ficha'}” da campanha? A ficha continuará salva na conta do jogador.`)) return;

        await estado.repositorio.removerEnvio(envio.envio_id);
        await contexto.campanhas.atualizarConteudoCampanha();
        mostrarAviso('Ficha retirada da campanha, sem apagar a ficha do jogador.');
    }

    function selecionarFicha(id) {
        fichaSelecionada = fichasDisponiveis().some((envio) => envio.ficha_id === id) ? id : '';
        parteComparada = null;
        atualizarBotoes();
        void atualizarVisualizacao();
    }

    function compararParte(parte) {
        if (!Object.hasOwn(PARTES_FICHA, parte)) return;
        parteComparada = parte;
        atualizarBotoes();
        void atualizarVisualizacao();
    }

    async function atualizarVisualizacao() {
        const versao = ++estado.versaoFicha;
        const campanhaId = estado.campanhaId;
        const versaoSessao = estado.versaoSessao;
        const fichas = fichasDisponiveis();
        const area = porId('conteudo-fichas');

        if (!campanhaId) {
            mostrarMensagem('Selecione uma campanha na aba Campanhas para consultar as fichas.');
            return;
        }
        if (!fichas.length) {
            mostrarMensagem('Nenhuma ficha compartilhada nesta campanha. Aguarde o envio de um personagem.');
            return;
        }

        const comparando = Boolean(parteComparada);
        const selecionadas = comparando
            ? fichas
            : fichas.filter((envio) => envio.ficha_id === fichaSelecionada);
        if (!selecionadas.length) {
            mostrarMensagem('Selecione um personagem ou compare Jogadores, Personagens ou Inventários.');
            return;
        }

        area.className = `conteudo-fichas ${comparando ? 'modo-comparacao' : 'modo-completo'}`;
        area.replaceChildren(elemento('p', 'estado-consulta-fichas', 'Carregando fichas compartilhadas…'));
        porId('quadro-fichas').setAttribute('aria-busy', 'true');

        // A RPC retorna apenas dados de Jogador, Personagem e Inventário.
        // Ela nunca devolve desenhoCanvas, itensQuadro ou outros dados privados.
        const resultados = await Promise.allSettled(selecionadas.map((envio) =>
            estado.repositorio.obterFicha(campanhaId, envio.ficha_id)));

        if (versao !== estado.versaoFicha || campanhaId !== estado.campanhaId
            || versaoSessao !== estado.versaoSessao) return;

        const colunas = document.createDocumentFragment();
        let erros = 0;
        for (const [indice, resultado] of resultados.entries()) {
            if (resultado.status === 'rejected') {
                erros++;
                const coluna = elemento('p', 'estado-consulta-fichas',
                    `Não foi possível consultar ${nomeDoPersonagem(selecionadas[indice])}.`);
                colunas.append(coluna);
                continue;
            }
            const registro = resultado.value;
            const partes = comparando ? [parteComparada] : Object.keys(PARTES_FICHA);
            for (const parte of partes) {
                colunas.append(criarParteFicha(registro, parte, { comparacao: comparando }));
            }
        }

        area.replaceChildren(colunas);
        porId('quadro-fichas').setAttribute('aria-busy', 'false');
        if (erros) mostrarAviso(`Não foi possível carregar ${erros} ficha(s). Confira o SQL 006 e as permissões da campanha.`, true);
    }

    function iniciarEventos() {
        porId('seletor-personagem').addEventListener('change', (evento) =>
            selecionarFicha(evento.target.value));
        for (const botao of document.querySelectorAll('[data-comparar-ficha]')) {
            botao.addEventListener('click', () => compararParte(botao.dataset.compararFicha));
        }
        listarEnvios();
    }

    return {
        iniciarEventos, limparVisualizacao, listarEnvios, listarCombatentes,
        decidirFicha, removerFicha, selecionarFicha, compararParte, atualizarVisualizacao,
    };
}
