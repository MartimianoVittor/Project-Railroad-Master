import { criarParteFicha, PARTES_FICHA } from '../modules/visualizarFicha.js?v=mesa-35';
import { mostrarAviso } from '../core/feedback.js?v=mesa-35';
import { porId, elemento } from '../core/dom.js?v=mesa-35';

/**
 * Seleção individual (três colunas) e comparação horizontal (uma parte de cada ficha).
 * Apenas envios aceitos ou pendentes são consultáveis; a autorização real é da RPC.
 */
export function criarControladorFichas(contexto) {
    const { estado } = contexto;
    let campanhaAnterior = null;
    let fichaSelecionada = '';
    let parteComparada = null;
    let registroDoCombate = null; // NPC consultado no quadro existente, nunca editável.
    const VALOR_NPC_COMBATE = '__consulta-npc-combate__';

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
        area.replaceChildren(elemento('p', 'estado-consulta-fichas rr-estado-vazio', mensagem));
        porId('quadro-fichas').setAttribute('aria-busy', 'false');
    }

    function limparVisualizacao() {
        fichaSelecionada = '';
        parteComparada = null;
        registroDoCombate = null;
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
        if (registroDoCombate) {
            const npc = elemento('option', '', `NPC · ${registroDoCombate.nome}`);
            npc.value = VALOR_NPC_COMBATE;
            seletor.append(npc);
        }
        seletor.value = registroDoCombate ? VALOR_NPC_COMBATE : fichaSelecionada;
        seletor.disabled = !fichas.length && !registroDoCombate;
        for (const botao of document.querySelectorAll('[data-comparar-ficha]')) {
            botao.disabled = !fichas.length;
        }

        // A lista de combate pertence exclusivamente ao controlador Combate.
        if (estado.navegacao?.atual === 'fichas') void atualizarVisualizacao();
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
        registroDoCombate = null;
        atualizarBotoes();
        listarEnvios();
        if (estado.navegacao?.atual !== 'fichas') void atualizarVisualizacao();
    }

    function compararParte(parte) {
        if (!Object.hasOwn(PARTES_FICHA, parte)) return;
        parteComparada = parte;
        registroDoCombate = null;
        atualizarBotoes();
        listarEnvios();
        if (estado.navegacao?.atual !== 'fichas') void atualizarVisualizacao();
    }

    // Entrada pelo cartão "Em ação" na página Combate: reutiliza o quadro de
    // visualização de Fichas e sua navegação, sem criar janelas adicionais.
    function abrirConsultaDoCombate() {
        const jaEmFichas = estado.navegacao?.atual === 'fichas';
        estado.navegacao?.abrir?.('fichas');
        if (jaEmFichas) void atualizarVisualizacao();
    }

    function consultarFichaDoCombate(id) {
        if (campanhaAnterior !== estado.campanhaId) limparVisualizacao();
        if (!fichasDisponiveis().some((envio) => envio.ficha_id === id)) {
            mostrarAviso('Esta ficha não está disponível na campanha.', true);
            return;
        }
        registroDoCombate = null;
        fichaSelecionada = id;
        parteComparada = null;
        atualizarBotoes();
        listarEnvios();
        abrirConsultaDoCombate();
    }

    function consultarRegistroDoCombate(registro, nome) {
        if (!estado.campanhaId || !registro) return;
        if (campanhaAnterior !== estado.campanhaId) limparVisualizacao();
        registroDoCombate = { registro, nome: nome || registro.titulo || 'NPC', campanhaId: estado.campanhaId };
        fichaSelecionada = '';
        parteComparada = null;
        atualizarBotoes();
        listarEnvios();
        abrirConsultaDoCombate();
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
        if (registroDoCombate && registroDoCombate.campanhaId === campanhaId) {
            area.className = 'conteudo-fichas modo-completo';
            area.replaceChildren(...Object.keys(PARTES_FICHA).map((parte) =>
                criarParteFicha(registroDoCombate.registro, parte)));
            porId('quadro-fichas').setAttribute('aria-busy', 'false');
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
        area.replaceChildren(elemento('p', 'estado-consulta-fichas rr-estado-vazio', 'Carregando fichas compartilhadas…'));
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
                const coluna = elemento('p', 'estado-consulta-fichas rr-estado-vazio',
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
        iniciarEventos, limparVisualizacao, listarEnvios,
        decidirFicha, removerFicha, selecionarFicha, compararParte, atualizarVisualizacao,
        consultarFichaDoCombate, consultarRegistroDoCombate,
    };
}
