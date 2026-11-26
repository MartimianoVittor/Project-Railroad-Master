import { confirmar } from '../core/dialogos.js?v=mesa-44';
import { agruparParticipantes } from '../modules/participantes.js?v=mesa-44';
import { executar, mostrarAviso } from '../core/feedback.js?v=mesa-44';
import { porId, elemento, mensagemLista, dataBreve, botaoAcao } from '../core/dom.js?v=mesa-44';
import { UUID, ESTADOS_CONVITE, ESTADOS_FICHA } from '../app/estado.js?v=mesa-44';

/** Prioriza a campanha ativa sem modificar a ordem dos registros restantes. */
export function ordenarCampanhas(campanhas, idAtivo) {
    const indice = campanhas.findIndex(item => item.campanha_id === idAtivo);
    if (indice <= 0) return [...campanhas];
    return [campanhas[indice], ...campanhas.slice(0, indice), ...campanhas.slice(indice + 1)];
}

/** Campanhas, convites, participantes e sincronização com o Supabase. */
export function criarControladorCampanhas(contexto) {
    const { estado } = contexto;
    function mostrarCampanha() {
        const campanha = estado.campanhas.find((item) => item.campanha_id === estado.campanhaId);
        porId('sem-campanha').hidden = Boolean(campanha);
        porId('painel-campanha').hidden = !campanha;

        porId('campanha-ativa').textContent = campanha?.nome ?? 'Nenhuma Selecionada';
        porId('salvar-campanha').disabled = !campanha;
        contexto.diario.atualizarHabilitacaoSessoes();
        contexto.diario.atualizarStatusRascunho();

        if (campanha) {
            porId('titulo-campanha').textContent = campanha.nome;
            porId('descricao-campanha-ativa').textContent = campanha.descricao || '';
            porId('descricao-campanha-ativa').hidden = !campanha.descricao;
            porId('total-jogadores').textContent = String(agruparParticipantes(estado.participantes).length);
        }
    }

    function listarCampanhas() {
        const lista = porId('lista-campanhas');
        lista.replaceChildren();
        porId('total-campanhas').textContent = String(estado.campanhas.length);
        // Mantém a orientação inicial, sem exibir um título redundante após criar campanhas.
        const instrucao = porId('instrucao-campanhas');
        instrucao.textContent = 'Crie sua primeira campanha';
        instrucao.hidden = estado.campanhas.length > 0;

        for (const campanha of ordenarCampanhas(estado.campanhas, estado.campanhaId)) {
            const linha = elemento('li', 'item-campanha');
            const selecionada = campanha.campanha_id === estado.campanhaId;
            if (selecionada) linha.classList.add('selecionada');

            const informacoes = elemento('div', 'item-campanha-info');
            informacoes.append(
                elemento('strong', '', campanha.nome),
                elemento('small', '', `Criada em ${dataBreve(campanha.criada_em)}`),
            );
            const botao = botaoAcao(selecionada ? 'Selecionado' : 'Selecionar', () => selecionarCampanha(campanha.campanha_id),
                'botao botao-pequeno botao-selecionar');
            botao.setAttribute('aria-label', selecionada ? `Campanha selecionada: ${campanha.nome}` : `Selecionar campanha ${campanha.nome}`);
            botao.setAttribute('aria-pressed', String(selecionada));
            const acoes = elemento('div', 'item-campanha-acoes');
            const excluir = botaoAcao('Excluir', () => void excluirCampanha(campanha),
                'botao botao-pequeno botao-excluir-campanha');
            excluir.setAttribute('aria-label', `Excluir campanha ${campanha.nome}`);
            acoes.append(excluir, botao);
            linha.append(informacoes, acoes);
            lista.append(linha);
        }

        if (estado.campanhaId) lista.scrollTop = 0;
        if (!estado.campanhas.length) mensagemLista(lista, 'Nenhuma campanha criada até o momento.');
    }

    function listarParticipantes() {
        const lista = porId('lista-participantes');
        lista.replaceChildren();
        const participantes = agruparParticipantes(estado.participantes);
        porId('total-jogadores').textContent = String(participantes.length);

        for (const participante of participantes) {
            const linha = elemento('li', 'participante');
            const cabecalho = elemento('div', 'participante-cabecalho');
            const jogador = elemento('div', 'participante-identidade');

            jogador.append(
                elemento('span', 'rotulo-campo', 'JOGADOR'),
                elemento('strong', 'nome-jogador', participante.jogadorNome),
            );
            // O estado do convite fica abaixo do nome do jogador, na posição
            // anteriormente ocupada pela ação de exclusão.
            cabecalho.append(
                jogador,
                elemento('span', `selo-status status-${participante.conviteStatus}`,
                    ESTADOS_CONVITE[participante.conviteStatus] ?? participante.conviteStatus),
            );
            linha.append(cabecalho);

            const personagens = elemento('div', 'personagens-participante');
            if (participante.personagens.length) {
                for (const personagem of participante.personagens) {
                    const item = elemento('div', 'personagem-participante');
                    const identidade = elemento('div', 'personagem-identidade');
                    identidade.append(
                        elemento('span', 'rotulo-campo', 'PERSONAGEM'),
                        elemento('strong', 'nome-personagem-lista', personagem.nome),
                    );
                    item.append(
                        identidade,
                        elemento('span', `selo-status status-${personagem.status}`,
                            ESTADOS_FICHA[personagem.status] ?? personagem.status),
                    );

                    if (personagem.status === 'pendente' && participante.conviteStatus === 'aceito') {
                        const envio = estado.envios.find((registro) => registro.envio_id === personagem.envioId);
                        if (envio) {
                            const acoes = elemento('div', 'acoes-participante');
                            acoes.append(
                                botaoAcao('Aceitar entrada', () => contexto.fichas.decidirFicha(envio, true),
                                    'botao botao-pequeno rr-botao-marrom'),
                                botaoAcao('Negar entrada', () => contexto.fichas.decidirFicha(envio, false),
                                    'botao botao-pequeno rr-botao-vermelho'),
                            );
                            item.append(acoes);
                        }
                    }
                    personagens.append(item);
                }
            } else {
                const texto = participante.conviteStatus === 'pendente'
                    ? 'Aguardando o jogador aceitar o convite e enviar um personagem.'
                    : participante.conviteStatus === 'recusado'
                        ? 'O jogador recusou o convite.'
                        : 'Nenhum personagem enviado até o momento.';
                personagens.append(elemento('p', 'personagem-ausente rr-estado-vazio rr-estado-vazio--compacto', texto));
            }

            // A exclusão fica à direita, abaixo do último personagem.
            if (participante.conviteStatus === 'aceito'
                || participante.personagens.some((personagem) => personagem.status === 'aprovada')) {
                const acoesExclusao = elemento('div', 'acoes-participante acoes-exclusao');
                acoesExclusao.append(botaoAcao('Excluir da mesa', () => excluirJogador(participante),
                    'botao botao-pequeno botao-discreto botao-remover'));
                personagens.append(acoesExclusao);
            }
            linha.append(personagens);

            lista.append(linha);
        }

        if (!participantes.length) mensagemLista(lista, estado.campanhaId
            ? 'Nenhum jogador nesta campanha. Use Adicionar jogador para enviar um convite.'
            : 'Selecione uma campanha para visualizar seus jogadores.');
    }

    function mostrarFormularioConvite(aberto) {
        porId('painel-adicionar-jogador').hidden = !aberto;
        porId('mostrar-convite').setAttribute('aria-expanded', String(aberto));
        if (aberto) porId('codigo-jogador').focus();
    }

    async function atualizarConteudoCampanha() {
        if (!estado.campanhaId || !estado.usuario) return;

        const campanhaId = estado.campanhaId;
        const versao = ++estado.versaoCampanha;
        const versaoSessao = estado.versaoSessao;
        const [participantes, envios] = await Promise.all([
            estado.repositorio.listarParticipantes(campanhaId),
            estado.repositorio.listarEnvios(campanhaId),
        ]);

        if (versao !== estado.versaoCampanha || versaoSessao !== estado.versaoSessao
            || campanhaId !== estado.campanhaId) return;

        estado.participantes = participantes ?? [];
        estado.envios = envios ?? [];
        listarParticipantes();
        contexto.fichas.listarEnvios();

    }

    async function selecionarCampanha(id) {
        if (!estado.campanhas.some((campanha) => campanha.campanha_id === id)) return;
        const mudou = estado.campanhaId !== id;
        if (mudou && estado.rascunhoSujo && !await confirmar(
            'O diário da campanha atual tem alterações não salvas. Deseja trocar de campanha e descartá-las?'
        )) return;
        if (mudou && !(await contexto.npcs.confirmarSaida())) return;

        estado.campanhaId = id;
        estado.participantes = [];
        estado.envios = [];
        estado.personagensAprovados = [];
        estado.catalogoJogadoresConfirmado = false;
        estado.catalogoDiretoConfirmado = false;
        if (mudou) estado.referenciasRemovidasMesa = new Set();
        estado.versaoCampanha++;
        if (mudou) {
            await Promise.all([contexto.diario.carregarRascunho(), contexto.npcs.carregarCampanha()]);
            mostrarFormularioConvite(false);
        }
        listarCampanhas();
        listarParticipantes();
        contexto.fichas.listarEnvios();
        mostrarCampanha();
        await atualizarConteudoCampanha();
    }

    async function atualizarCampanhas(idPreferido = null) {
        if (!estado.usuario) return;

        const versao = ++estado.versaoLista;
        const versaoSessao = estado.versaoSessao;
        const campanhas = await estado.repositorio.listarCampanhas();
        if (versao !== estado.versaoLista || versaoSessao !== estado.versaoSessao) return;

        estado.campanhas = campanhas ?? [];
        const preferida = estado.campanhas.find((item) =>
            item.campanha_id === (idPreferido ?? estado.campanhaId));
        const id = preferida?.campanha_id ?? null;

        if (id) await selecionarCampanha(id);
        else {
            estado.campanhaId = null;
            estado.participantes = [];
            estado.envios = [];
            estado.personagensAprovados = [];
            estado.versaoCampanha++;
            await Promise.all([contexto.diario.carregarRascunho(), contexto.npcs.carregarCampanha()]);
            listarCampanhas();
            listarParticipantes();
            contexto.fichas.listarEnvios();
            mostrarCampanha();
        }
    }

    async function criarCampanha() {
        const campo = porId('nome-campanha');
        const nome = campo.value.trim();
        const descricao = porId('descricao-campanha').value.trim();
        if (!nome || nome.length > 120) throw new Error('Informe um nome de campanha de até 120 caracteres.');
        if (descricao.length > 1000) throw new Error('A descrição deve ter no máximo 1000 caracteres.');
        if (estado.rascunhoSujo && !await confirmar(
            'Há anotações não salvas na campanha atual. Criar outra campanha descartará essas alterações. Continuar?'
        )) return;

        const id = await estado.repositorio.criarCampanha(nome, descricao);
        campo.value = '';
        porId('descricao-campanha').value = '';
        // A troca foi confirmada antes da criação; evita uma segunda confirmação.
        estado.rascunhoSujo = false;
        await atualizarCampanhas(id);
        mostrarAviso(estado.modoLocal ? 'Campanha local criada neste navegador.' : 'Campanha criada. Agora convide seus jogadores.');
    }

    async function excluirCampanha(campanha) {
        if (!estado.usuario || !estado.campanhas.some((item) => item.campanha_id === campanha.campanha_id)) return;
        const nome = campanha.nome;
        if (!await confirmar(estado.modoLocal ? `Excluir a campanha local “${nome}”? Os diários e NPCs locais associados poderão permanecer armazenados no navegador, mas a campanha deixará de ser acessível. Esta ação não pode ser desfeita.` : `Excluir permanentemente a campanha “${nome}”? Os convites, vínculos de jogadores e envios desta campanha serão removidos. As fichas pessoais dos jogadores serão preservadas. Esta ação não pode ser desfeita.`)) return;
        if (!await confirmar(`Confirma a exclusão definitiva de “${nome}”?`)) return;

        try {
            await estado.repositorio.excluirCampanha(campanha.campanha_id);
            if (estado.campanhaId === campanha.campanha_id) {
                estado.rascunhoSujo = false;
                estado.campanhaId = null;
            }
            await atualizarCampanhas();
            mostrarAviso(`Campanha “${nome}” excluída.`);
        } catch (erro) {
            mostrarAviso(`Não foi possível excluir a campanha: ${erro.message}`, true);
        }
    }

    async function convidarJogador() {
        const campo = porId('codigo-jogador');
        const id = campo.value.trim();
        if (!UUID.test(id)) throw new Error('Informe o código completo do jogador (UUID).');
        if (!estado.campanhaId) throw new Error('Selecione uma campanha primeiro.');

        await estado.repositorio.convidarJogador(estado.campanhaId, id);
        campo.value = '';
        mostrarFormularioConvite(false);
        await atualizarConteudoCampanha();
        mostrarAviso('Convite registrado. O jogador verá a solicitação nas fichas online.');
    }

    async function excluirJogador(participante) {
        if (!estado.campanhaId || !estado.participantes.some(
            (registro) => registro.jogador_id === participante.jogadorId)) return;

        if (!await confirmar(`Excluir “${participante.jogadorNome}” da mesa? Todos os personagens enviados por esse jogador serão retirados desta campanha. As fichas continuarão salvas na conta do jogador.`)) return;

        // Registra as fichas da pessoa antes que as RPCs removam seus vínculos.
        const enviosPorId = new Map(estado.envios.map(envio => [envio.envio_id, envio]));
        const refs = new Set(estado.participantes
            .filter(item => item.jogador_id === participante.jogadorId)
            .map(item => item.ficha_id || enviosPorId.get(item.envio_id)?.ficha_id)
            .filter(Boolean));
        for (const envio of estado.envios)
            if (envio.jogador_id === participante.jogadorId && envio.ficha_id) refs.add(envio.ficha_id);
        for (const ficha of estado.personagensAprovados)
            if (ficha.jogador_id === participante.jogadorId && ficha.ficha_id) refs.add(ficha.ficha_id);
        await estado.repositorio.excluirJogador(estado.campanhaId, participante.jogadorId);
        for (const ref of refs) contexto.removerParticipanteMesa?.('jogador', ref);
        await atualizarConteudoCampanha();
        await contexto.revalidarParticipantesMesa?.({ recarregarNpcs: false });
        mostrarAviso('Jogador excluído da mesa. Suas fichas pessoais foram preservadas.');
    }

    function iniciarEventos() {
        porId('form-campanha').addEventListener('submit', (evento) => {
            evento.preventDefault();
            const botao = evento.currentTarget.querySelector('button[type="submit"]');
            void executar(botao, criarCampanha);
        });
        porId('atualizar-campanha').addEventListener('click', () =>
            void executar(porId('atualizar-campanha'), async () => {
                await atualizarCampanhas(estado.campanhaId);
                mostrarAviso('Informações da campanha atualizadas.');
            }));
        porId('mostrar-convite').addEventListener('click', () => {
            if (estado.modoLocal) return mostrarAviso('Convites exigem entrar com Google.', true);
            mostrarFormularioConvite(porId('painel-adicionar-jogador').hidden);
        });
        porId('form-convite').addEventListener('submit', (evento) => {
            evento.preventDefault();
            const botao = evento.currentTarget.querySelector('button[type="submit"]');
            void executar(botao, convidarJogador);
        });
    }

    return {
        iniciarEventos,
        mostrarCampanha, listarCampanhas, listarParticipantes, mostrarFormularioConvite,
        atualizarConteudoCampanha, selecionarCampanha, atualizarCampanhas,
        criarCampanha, convidarJogador, excluirJogador, excluirCampanha,
    };
}
