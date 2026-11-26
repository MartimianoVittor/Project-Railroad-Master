import { confirmar, informar } from '../core/dialogos.js?v=mesa-44';
import { botao, elemento, porId } from '../core/dom.js?v=mesa-44';
import { mostrarAviso } from '../core/feedback.js?v=mesa-44';
import { criarCombatente, imagemDaFicha, imagemValida, inteiro, ordemDeIniciativa } from '../modules/combate/combatentes.js?v=mesa-44';
import { desenharConsultaFicha, registroNpcParaConsulta } from '../modules/combate/consulta.js?v=mesa-44';
import { mostrarIniciativa } from '../modules/combate/iniciativa.js?v=mesa-44';
import { criarDetalhe } from '../modules/combate/detalhe.js?v=mesa-44';
import { listarPersonagensDisponiveis } from '../modules/personagensCampanha.js?v=mesa-44';
import { catalogosConfirmadosMesa, filtrarParticipantesDesvinculados, filtrarReferenciaRemovida } from '../modules/participantesMesa.js?v=mesa-44';
import { gravarNpcsCombateRemoto } from '../services/conteudoCampanha.js?v=mesa-44';
import { criarSincronizadorEstadoMesa } from '../services/estadosMesa.js?v=mesa-44';
import { atualizarCatalogoPersonagens } from '../services/catalogoPersonagens.js?v=mesa-44';

export function criarControladorCombate({ estado, campanhas }) {
    let combatentes = [];
    let selecionado = null;
    let atual = null;
    let turno = 0;
    let animarProximo = false;
    // Consulta temporária no cartão da própria página Combate, sem navegação e sem modal.
    let fichaEmConsulta = null;
    let versaoDaConsulta = 0;
    const imagensEmConsulta = new Set();
    const chave = () => `railroad-combate:v1:${estado.usuario?.id}:${estado.campanhaId}`;
    const pacote = () => ({
        combatentes,
        selecionado,
        atual,
        turno
    });
    // Fotos de fichas não precisam ser duplicadas no banco: são recuperadas da fonte.
    const pacoteRemoto = () => ({
        ...pacote(),
        combatentes: combatentes.map(({ imagem, ...combatente }) => combatente)
    });
    const preservarLocal = () => {
        try {
            sessionStorage.setItem(chave(), JSON.stringify(pacote()));
        } catch (e) {
            console.warn('Backup da sessão indisponível:', e);
        }
        try {
            localStorage.setItem(chave(), JSON.stringify(pacoteRemoto()));
        } catch (e) {
            console.warn('Backup local do combate indisponível:', e);
        }
    };
    const salvar = () => {
        preservarLocal();
        sincronizadorEstado.agendar();
    };

    function aplicarPacote(dados) {
        if (fichaEmConsulta && !dados?.combatentes?.some(combatente => combatente.id === fichaEmConsulta.id)) {
            fichaEmConsulta = null;
            versaoDaConsulta++;
        }
        restaurarCampos(dados);
        imagensEmConsulta.clear();
        renderizar();
    }
    const sincronizadorEstado = criarSincronizadorEstadoMesa({
        estado,
        tipo: 'combate',
        obterDados: pacoteRemoto,
        aplicarDados: aplicarPacote,
        temConteudo: dados => Array.isArray(dados?.combatentes) && dados.combatentes.length > 0,
        preservarLocal,
        aoBloqueio: bloqueado => { porId('combate-sincronizar').hidden = !bloqueado; },
        aoCarregar: () => reconciliarParticipantes(),
        avisar: mensagem => {
            console.warn(mensagem);
            mostrarAviso(mensagem, true);
        }
    });

    function restaurarCampos(dados) {
        combatentes = Array.isArray(dados?.combatentes) ? dados.combatentes : [];
        selecionado = dados?.selecionado ?? null;
        atual = dados?.atual ?? null;
        turno = inteiro(dados?.turno);
    }

    function lerBackup() {
        try {
            const texto = localStorage.getItem(chave()) || sessionStorage.getItem(chave());
            return JSON.parse(texto);
        } catch {
            return null;
        }
    }
    let escopo = '';

    function sincronizar() {
        const novo = `${estado.usuario?.id}:${estado.campanhaId}`;
        if (escopo !== novo) {
            escopo = novo;
            fichaEmConsulta = null;
            versaoDaConsulta++;
            imagensEmConsulta.clear();
            nomesJogadores.clear();
            restaurarCampos(estado.campanhaId ? lerBackup() : null);
        }
        void sincronizadorEstado.ativar();
    }
    const ordenados = () => [...combatentes].filter(combatente => inteiro(combatente.ferimentos, 0, 3) < 3).sort(ordemDeIniciativa);
    const encontrar = () => combatentes.find(combatente => combatente.id === selecionado);
    const nomesJogadores = new Map();

    function obterDisponiveis() {
        return listarPersonagensDisponiveis(estado, nomesJogadores);
    }

    async function adicionar(item) {
        const campanha = estado.campanhaId;
        const sessao = estado.versaoSessao;
        if (!campanha || combatentes.some(combatente => combatente.id === item.id))
            return;
        let origem;
        if (item.tipo === 'jogador') {
            if (!estado.repositorio?.obterFicha) {
                void informar('Consulta de fichas indisponível neste modo.');
                return;
            }
            try {
                origem = await estado.repositorio.obterFicha(campanha, item.ref);
            } catch {
                if (estado.campanhaId === campanha)
                    void informar('Não foi possível carregar esta ficha.');
                return;
            }
            if (campanha !== estado.campanhaId || sessao !== estado.versaoSessao || combatentes.some(combatente => combatente.id === item.id))
                return;
            const personagem = origem.dados?.personagem || {};
            item.nome = personagem['nome-personagem'] || item.nome;
            item.responsavel = origem.dados?.nome || item.responsavel;
            item.papel = personagem['profissao-personagem'] || personagem.profissao || '';
            nomesJogadores.set(item.ref, item.responsavel);
        } else {
            origem = estado.npcs.find(npc => npc.id === item.ref);
            if (!origem)
                return;
        }
        combatentes.push(criarCombatente(item, origem, combatentes.length));
        selecionado = item.id;
        atual ||= item.id;
        salvar();
        renderizar();
    }

    async function removerCombatente(id) {
        const combatente = combatentes.find(combatente => combatente.id === id);
        if (!combatente || !await confirmar(`Retirar ${combatente.nome} do combate? Alterações temporárias desse personagem serão descartadas.`))
            return;
        if (fichaEmConsulta?.id === id)
            fecharConsultaFicha(false);
        combatentes = combatentes.filter(combatente => combatente.id !== id);
        const ordem = ordenados();
        if (atual === id)
            atual = ordem[0]?.id || null;
        if (selecionado === id)
            selecionado = atual || ordem[0]?.id || null;
        salvar();
        renderizar();
    }

    function alternarPreparada(combatente) {
        combatente.preparada = combatente.preparada ? '' : ' ';
        selecionado = combatente.id;
        salvar();
        renderizar();
    }

    function atualizar() {
        sincronizar();
        reconciliarParticipantes();
        renderizar();
    }

    /** Só concilia categorias com fonte confirmada; rede indisponível não apaga a mesa. */
    function reconciliarParticipantes() {
        if (escopo !== `${estado.usuario?.id}:${estado.campanhaId}` || !estado.campanhaId) return 0;
        const { itens, removidos } = filtrarParticipantesDesvinculados(
            combatentes, catalogosConfirmadosMesa(estado));
        if (!removidos.length) return 0;
        combatentes = itens;
        ajustarSelecaoAposRemocao(removidos);
        salvar();
        renderizar();
        return removidos.length;
    }

    function ajustarSelecaoAposRemocao(removidos) {
        const ids = new Set(removidos.map(item => item.id));
        if (ids.has(fichaEmConsulta?.id)) fecharConsultaFicha(false);
        if (ids.has(atual)) atual = null;
        if (ids.has(selecionado)) selecionado = null;
        const primeiro = ordenados()[0]?.id ?? null;
        atual ||= primeiro;
        selecionado ||= atual;
    }

    function removerReferencia(tipo, ref) {
        if (!estado.campanhaId || !estado.usuario?.id) return 0;
        if (escopo !== `${estado.usuario.id}:${estado.campanhaId}`) sincronizar();
        const { itens, removidos } = filtrarReferenciaRemovida(combatentes, tipo, ref);
        if (!removidos.length) return 0;
        combatentes = itens;
        ajustarSelecaoAposRemocao(removidos);
        salvar();
        renderizar();
        return removidos.length;
    }

    function selecionar(combatente) {
        fecharConsultaFicha(false);
        selecionado = combatente.id;
        salvar();
        renderizar();
    }

    function mudarIniciativa(combatente, iniciativa) {
        combatente.iniciativa = iniciativa;
        salvar();
        renderizar(false);
    }

    function renderizar(comDetalhe = true) {
        const ordem = ordenados();
        if (!ordem.some((combatente) => combatente.id === atual)) atual = ordem[0]?.id ?? null;
        mostrarIniciativa({ combatentes, ordem, atual, selecionado, animar: animarProximo }, {
            selecionar, mudarIniciativa, preparar: alternarPreparada,
            consultar: abrirFichaEmAcao, remover: removerCombatente,
        });
        animarProximo = false;
        if (comDetalhe) detalhe();
    }

    function fecharConsultaFicha(redesenhar = true) {
        versaoDaConsulta++;
        fichaEmConsulta = null;
        if (redesenhar)
            detalhe();
    }

    async function abrirFichaEmAcao(combatente) {
        if (!combatente)
            return;
        const versao = ++versaoDaConsulta;
        const campanhaId = estado.campanhaId;
        const versaoSessao = estado.versaoSessao;
        selecionado = combatente.id;
        fichaEmConsulta = {
            id: combatente.id,
            status: 'carregando'
        };
        salvar();
        renderizar(false);
        // Marca o combatente selecionado sem substituir o painel.
        detalhe();
        try {
            let registro;
            if (combatente.tipo === 'jogador') {
                if (!campanhaId || !estado.repositorio?.obterFicha)
                    throw new Error('A consulta da ficha não está disponível nesta campanha.');
                registro = await estado.repositorio.obterFicha(campanhaId, combatente.ref);
            } else {
                const npc = (estado.npcs || []).find(n => n.id === combatente.ref);
                if (!npc)
                    throw new Error('A ficha deste NPC não está disponível na campanha.');
                registro = registroNpcParaConsulta(npc, combatente);
            }
            if (versao !== versaoDaConsulta || estado.campanhaId !== campanhaId || estado.versaoSessao !== versaoSessao || !combatentes.some(item => item.id === combatente.id))
                return;
            fichaEmConsulta = {
                id: combatente.id,
                status: 'pronta',
                registro
            };
        } catch (erro) {
            if (versao !== versaoDaConsulta || estado.campanhaId !== campanhaId)
                return;
            fichaEmConsulta = {
                id: combatente.id,
                status: 'erro',
                mensagem: erro?.message || 'A ficha não pôde ser consultada.'
            };
        }
        if (selecionado === combatente.id)
            detalhe();
    }

    async function recuperarRetrato(combatente, retrato) {
        if (combatente.tipo !== 'jogador' || imagemValida(combatente.imagem) || !estado.repositorio?.obterFicha || !estado.campanhaId || !combatente.ref)
            return;
        const campanha = estado.campanhaId;
        const chaveRetrato = `${campanha}:${combatente.ref}`;
        if (imagensEmConsulta.has(chaveRetrato))
            return;
        imagensEmConsulta.add(chaveRetrato);
        try {
            const ficha = await estado.repositorio.obterFicha(campanha, combatente.ref);
            if (estado.campanhaId !== campanha || !combatentes.includes(combatente))
                return;
            const foto = imagemDaFicha(ficha);
            if (foto) {
                combatente.imagem = foto;
                salvar();
                if (retrato.isConnected)
                    retrato.src = foto;
            }
        } catch (e) {
            console.warn('Retrato do combatente indisponível:', e);
        }
    }

    function detalhe() {
        const area = porId('combate-detalhe');
        area.replaceChildren();
        const combatente = encontrar();
        if (fichaEmConsulta?.id !== combatente?.id && fichaEmConsulta)
            fecharConsultaFicha(false);
        if (combatente && fichaEmConsulta?.id === combatente.id) {
            desenharConsultaFicha(combatente, area, fichaEmConsulta, fecharConsultaFicha);
            return;
        }
        area.classList.remove('combate-consulta-ficha-ativa');
        area.removeAttribute('aria-busy');
        if (!combatente) {
            area.append(elemento('p', 'rr-estado-vazio', 'Adicione ou selecione um combatente para visualizar sua ficha.'));
            return;
        }
        const fotoNpc = combatente.tipo === 'npc' ? estado.npcs.find(npc => npc.id === combatente.ref)?.imagem : '';
        area.append(criarDetalhe(combatente, {
            fotoNpc,
            recuperarRetrato,
            salvar,
            atualizarFila: () => {
                salvar();
                renderizar(false);
            },
            atualizarTudo: () => {
                salvar();
                renderizar();
            },
        }));
    }

    let erroListagem = '';

    async function carregarNomesJogadores() {
        if (!estado.repositorio?.obterFicha || !estado.campanhaId)
            return;
        const campanha = estado.campanhaId;
        const pendentes = obterDisponiveis().filter(e => e.tipo === 'jogador' && !nomesJogadores.has(e.ref)).map(e => ({ ficha_id: e.ref }));
        await Promise.all(pendentes.map(async e => {
            try {
                const reg = await estado.repositorio.obterFicha(campanha, e.ficha_id);
                if (estado.campanhaId === campanha) {
                    const nome = reg?.dados?.nome?.trim();
                    if (nome)
                        nomesJogadores.set(e.ficha_id, nome);
                }
            } catch {}
        }));
        if (estado.campanhaId === campanha && porId('combate-modal')?.open)
            listarDisponiveis();
    }

    function abrirModal() {
        const modal = porId('combate-modal');
        porId('combate-busca').value = '';
        erroListagem = '';
        listarDisponiveis();
        modal.showModal();
        void (async () => {
            const campanhaId = estado.campanhaId;
            try {
                await atualizarCatalogoPersonagens({ estado, campanhas });
                if (campanhaId !== estado.campanhaId || !modal.open) return;
                await carregarNomesJogadores();
                erroListagem = '';
            } catch (erro) {
                if (campanhaId !== estado.campanhaId || !modal.open) return;
                console.warn('Falha ao atualizar personagens do combate:', erro);
                erroListagem = `Falha ao atualizar fichas da campanha: ${erro.message}`;
            }
            if (modal.open && campanhaId === estado.campanhaId) listarDisponiveis();
        })();
    }

    function listarDisponiveis() {
        const busca = porId('combate-busca').value.toLocaleLowerCase('pt-BR');
        const area = porId('combate-disponiveis');
        area.replaceChildren();
        for (const item of obterDisponiveis().filter(x => `${x.nome} ${x.responsavel} ${x.papel || ''}`.toLocaleLowerCase('pt-BR').includes(busca))) {
            const opcao = botao(`${item.nome} · ${item.responsavel}${item.papel ? ' · ' + item.papel : ''}`, () => void adicionar(item));
            opcao.disabled = combatentes.some(combatente => combatente.id === item.id);
            area.append(opcao);
        }
        if (!area.children.length)
            area.append(elemento('p', 'rr-estado-vazio rr-estado-vazio--compacto',
                estado.modoLocal ? 'Nenhum NPC disponível no modo local.'
                    : 'Nenhuma ficha aprovada ou NPC disponível. Confira as aprovações na aba Campanhas.'));
        if (erroListagem)
            area.append(elemento('p', 'rr-estado-vazio rr-estado-vazio--compacto', erroListagem));
    }

    function passar() {
        const ordem = ordenados();
        if (!ordem.length)
            return;
        fecharConsultaFicha(false);
        const i = ordem.findIndex(combatente => combatente.id === atual);
        atual = ordem[(i + 1) % ordem.length].id;
        if (i === ordem.length - 1)
            turno++;
        selecionado = atual;
        animarProximo = true;
        salvar();
        renderizar();
    }

    async function encerrar() {
        const referenciasNpc = [...new Set(combatentes.filter((item) => item.tipo === 'npc').map((item) => item.ref))];
        if (referenciasNpc.length && !estado.modoLocal && !estado.npcsSincronizados) {
            mostrarAviso('Não é possível encerrar: os NPCs não foram carregados do Supabase. Recarregue a campanha sem perder o combate.', true);
            return;
        }
        const indisponiveis = referenciasNpc.filter((id) => !estado.npcs.some((npc) => npc.id === id));
        if (indisponiveis.length) {
            mostrarAviso(`Não é possível encerrar: ${indisponiveis.length} ficha(s) de NPC não estão disponíveis. O combate foi preservado.`, true);
            return;
        }
        if (!await confirmar('Encerrar combate? Ferimentos e armas de NPCs serão salvos; o estado do combate será encerrado.'))
            return;
        const campanhaId = estado.campanhaId;
        const sessao = estado.versaoSessao;
        const alterados = estado.npcs.map(n => {
            const combatente = combatentes.find(x => x.tipo === 'npc' && x.ref === n.id);
            return combatente ? {
                ...n,
                armas: structuredClone(combatente.armas),
                condicoes: {
                    ...n.condicoes,
                    ferimentos: combatente.ferimentos
                }
            } : null;
        }).filter(Boolean);
        let npcs = estado.npcs.map(n => alterados.find(a => a.id === n.id) || n);
        try {
            // Persistir primeiro no banco: se falhar, o combate não é encerrado.
            if (!estado.modoLocal && estado.campanhaId) {
                const confirmados = await gravarNpcsCombateRemoto(campanhaId, alterados);
                if (estado.campanhaId !== campanhaId || estado.versaoSessao !== sessao)
                    return;
                const revisoes = new Map(confirmados.map(({ id, revisao }) => [id, revisao]));
                npcs = npcs.map((npc) => revisoes.has(npc.id)
                    ? { ...npc, revisao: revisoes.get(npc.id) } : npc);
                // A nuvem confirmou a nova revisão; preserve-a em memória mesmo
                // que o cache local esteja cheio e a gravação posterior falhe.
                estado.npcs = npcs;
            }
            if (estado.campanhaId && estado.npcsRepo)
                estado.npcs = estado.npcsRepo.salvar(estado.usuario?.id, estado.campanhaId, npcs);
        } catch (e) {
            void informar(`Não foi possível salvar os NPCs: ${e.message}. O combate foi preservado.`);
            return;
        }
        if (combatentes.some(combatente => combatente.tipo === 'jogador'))
            void informar('As alterações nas fichas dos jogadores permanecem apenas neste combate. O Mestre não possui permissão para editar as fichas privadas dos jogadores.');
        combatentes = [];
        selecionado = null;
        atual = null;
        turno = 0;
        salvar();
        renderizar();
    }

    function iniciarEventos() {
        // O cartão inteiro abre a ficha no próprio detalhe; a estrela mantém sua ação independente.
        porId('combate-atual').closest('.combate-acao').addEventListener('click', evento => {
            if (evento.target.closest('button'))
                return;
            abrirFichaEmAcao(combatentes.find(combatente => combatente.id === atual));
        });
        porId('combate-adicionar').addEventListener('click', abrirModal);
        porId('combate-fechar').addEventListener('click', () => porId('combate-modal').close());
        porId('combate-busca').addEventListener('input', listarDisponiveis);
        porId('combate-passar').addEventListener('click', passar);
        porId('combate-sincronizar').addEventListener('click', () => void sincronizadorEstado.tentarNovamente());
        porId('combate-encerrar').addEventListener('click', encerrar);
    }
    return {
        iniciarEventos,
        atualizar,
        reconciliarParticipantes,
        removerReferencia,
    };
}
