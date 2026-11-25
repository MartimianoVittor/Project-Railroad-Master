import { listarSessoesRemotas, salvarSessoesRemotas } from '../services/conteudoCampanha.js?v=mesa-35';
import {
    criarSessao, duplicarSessao, moverSessao,
    LIMITE_DESCRICAO_SESSAO, LIMITE_NOME_SESSAO, LIMITE_SESSOES,
} from '../modules/diario/sessoes.js?v=mesa-35';
import { executar, mostrarAviso } from '../core/feedback.js?v=mesa-35';
import { porId, elemento } from '../core/dom.js?v=mesa-35';

/** Coordena as sessões do Diário e suas cópias local e remota. */
export function criarControladorDiario({ estado }, { listar = listarSessoesRemotas, salvar = salvarSessoesRemotas } = {}) {
    let idsRemotos = new Set();
    let revisaoRemota = 0;
    let escopoCarregado = null;
    let versaoEdicao = 0;
    let numeroCarga = 0;
    let falhouAoCarregar = false;
    let filaDeGravacao = Promise.resolve();
    const escopoAtual = () => `${estado.usuario?.id}:${estado.campanhaId}`;
    const disponivel = () => estado.campanhaId && (estado.modoLocal || escopoCarregado === escopoAtual());

    function atualizarStatusRascunho() {
        const indicador = porId('status-rascunho');
        indicador.classList.toggle('pendente', estado.rascunhoSujo);

        if (!estado.campanhaId) {
            indicador.textContent = 'Selecione uma campanha para editar o diário.';
        } else if (!disponivel()) {
            indicador.textContent = falhouAoCarregar
                ? 'Falha ao carregar as sessões do Supabase.'
                : 'Carregando as sessões do Supabase…';
        } else if (estado.rascunhoSujo) {
            indicador.textContent = (estado.modoLocal ? 'Sessão alterada — salve neste navegador.' : 'Sessão alterada — salve no Supabase.');
        } else if (estado.salvoEm) {
            const data = new Date(estado.salvoEm);
            indicador.textContent = `Sessões salvas em ${data.toLocaleString('pt-BR')}.`;
        } else {
            indicador.textContent = (estado.modoLocal ? 'Sessões armazenadas neste navegador.' : 'Sessões armazenadas no Supabase.');
        }
    }

    function guardarSessaoAtual() {
        const sessao = estado.sessoes.find((item) => item.id === estado.sessaoId);
        if (!sessao || !estado.quadro) return;
        sessao.notas = porId('diario-anotacoes').value;
        sessao.quadro = estado.quadro.coletar();
    }

    function renderizarSeletorSessoes() {
        const seletor = porId('seletor-sessoes');
        seletor.replaceChildren();
        estado.sessoes.forEach((sessao, indice) => {
            const opcao = elemento('option', '', `Sessão ${String(indice + 1).padStart(2, '0')} — ${sessao.nome || 'Sem título'}`);
            opcao.value = sessao.id;
            seletor.append(opcao);
        });
        if (!estado.sessoes.length) {
            const opcao = elemento('option', '', 'Nenhuma sessão criada');
            opcao.value = '';
            seletor.append(opcao);
        }
        seletor.value = estado.sessaoId ?? '';
        atualizarHabilitacaoSessoes();
    }

    function atualizarHabilitacaoSessoes() {
        const temCampanha = Boolean(disponivel());
        const temSessao = temCampanha && estado.sessoes.some((item) => item.id === estado.sessaoId);
        for (const id of ['seletor-sessoes', 'gerenciar-sessoes']) porId(id).disabled = !temSessao;
        porId('adicionar-sessao').disabled = !temCampanha;
        porId('salvar-sessao').disabled = !temSessao;
        porId('diario-anotacoes').disabled = !temSessao;
        porId('limpar-marcos').disabled = !temSessao;
        estado.quadro?.habilitar(temSessao);
    }

    function mostrarSessao() {
        const sessao = estado.sessoes.find((item) => item.id === estado.sessaoId);
        porId('diario-vazio').hidden = Boolean(sessao);
        porId('diario-conteudo').hidden = !sessao;
        porId('diario-anotacoes').value = sessao?.notas ?? '';
        estado.quadro?.restaurar(sessao?.quadro);
        renderizarSeletorSessoes();
        if (!estado.campanhaId) porId('diario-vazio').querySelector('p').textContent = 'Selecione uma campanha na aba Campanhas para criar sessões.';
        else porId('diario-vazio').querySelector('p').textContent = 'Crie sua primeira sessão para começar a registrar os acontecimentos e organizar suas ideias.';
    }

    async function carregarRascunho() {
        const carga = ++numeroCarga;
        const { campanhaId } = estado;
        const usuarioId = estado.usuario?.id;
        const escopo = escopoAtual();
        const aindaAtual = () => carga === numeroCarga && escopo === escopoAtual();
        escopoCarregado = null;
        falhouAoCarregar = false;
        idsRemotos = new Set();
        revisaoRemota = 0;

        const dados = estado.sessoesRepo.carregar(usuarioId, campanhaId);
        estado.sessoes = dados.sessoes;
        estado.sessaoId = dados.ativaId;
        estado.rascunhoSujo = false;
        estado.salvoEm = dados.salvoEm;
        mostrarSessao();
        atualizarStatusRascunho();
        if (estado.modoLocal || !campanhaId || !usuarioId) return;

        try {
            const remoto = await listar(campanhaId);
            if (!aindaAtual()) return;
            const existentes = new Set(remoto.sessoes.map((sessao) => sessao.id));
            const ausentes = dados.sessoes.filter((sessao) => !existentes.has(sessao.id));
            if (ausentes.length && confirm(`Há ${ausentes.length} sessão(ões) guardada(s) apenas neste navegador. Importar para o Supabase?`)) {
                remoto.sessoes.push(...ausentes);
                remoto.ativaId ||= dados.ativaId;
                remoto.revisao = await salvar(campanhaId, remoto, new Set(), remoto.revisao ?? 0);
                if (!aindaAtual()) return;
            }
            estado.sessoes = remoto.sessoes;
            estado.sessaoId = remoto.ativaId;
            estado.salvoEm = remoto.salvoEm;
            idsRemotos = new Set(remoto.sessoes.map((sessao) => sessao.id));
            revisaoRemota = Number(remoto.revisao ?? 0);
            escopoCarregado = escopo;
        } catch (erro) {
            if (!aindaAtual()) return;
            falhouAoCarregar = true;
            mostrarAviso(`Não foi possível carregar as sessões do Supabase: ${erro.message}`, true);
        }
        mostrarSessao();
        atualizarStatusRascunho();
    }

    function marcarRascunhoAlterado() {
        if (!estado.campanhaId) return;
        versaoEdicao++;
        estado.rascunhoSujo = true;
        atualizarStatusRascunho();
    }

    function selecionarSessao(id) {
        if (!estado.sessoes.some((sessao) => sessao.id === id)) return;
        guardarSessaoAtual();
        estado.sessaoId = id;
        mostrarSessao();
    }

    function atualizarContadorDescricao() {
        const campo = porId('descricao-nova-sessao');
        const caracteres = Array.from(campo.value);
        if (caracteres.length > LIMITE_DESCRICAO_SESSAO) campo.value = caracteres.slice(0, LIMITE_DESCRICAO_SESSAO).join('');
        porId('contador-descricao-sessao').textContent = `${Array.from(campo.value).length}/${LIMITE_DESCRICAO_SESSAO}`;
    }

    function abrirFormularioSessao(id = null) {
        if (!estado.campanhaId) throw new Error('Selecione uma campanha antes de criar sessões.');
        if (!id && estado.sessoes.length >= LIMITE_SESSOES) throw new Error(`Limite de ${LIMITE_SESSOES} sessões por campanha.`);
        const sessao = id ? estado.sessoes.find((item) => item.id === id) : null;
        if (id && !sessao) return;
        estado.sessaoEmEdicaoId = id;
        porId('form-nova-sessao').reset();
        porId('nome-nova-sessao').value = sessao?.nome ?? '';
        porId('descricao-nova-sessao').value = sessao?.descricao ?? '';
        porId('titulo-formulario-sessao').textContent = sessao ? 'Editar sessão' : 'Adicionar sessão';
        porId('confirmar-sessao').textContent = sessao ? 'Salvar alterações' : 'Criar sessão';
        atualizarContadorDescricao();
        porId('modal-criar-sessao').showModal();
        porId('nome-nova-sessao').focus();
    }

    function confirmarFormularioSessao() {
        if (!estado.campanhaId) throw new Error('Selecione uma campanha antes de criar sessões.');
        const nome = Array.from(porId('nome-nova-sessao').value.trim()).slice(0, LIMITE_NOME_SESSAO).join('');
        const descricao = Array.from(porId('descricao-nova-sessao').value.trim()).slice(0, LIMITE_DESCRICAO_SESSAO).join('');
        if (!nome) throw new Error('Informe um nome para a sessão.');
        guardarSessaoAtual();

        if (estado.sessaoEmEdicaoId) {
            const sessao = estado.sessoes.find((item) => item.id === estado.sessaoEmEdicaoId);
            if (!sessao) throw new Error('Sessão não encontrada.');
            sessao.nome = nome;
            sessao.descricao = descricao;
            mostrarAviso('Dados da sessão alterados. Clique em Salvar para guardar.');
        } else {
            if (estado.sessoes.length >= LIMITE_SESSOES) throw new Error(`Limite de ${LIMITE_SESSOES} sessões por campanha.`);
            const sessao = criarSessao({ nome, descricao });
            estado.sessoes.push(sessao);
            estado.sessaoId = sessao.id;
            mostrarAviso('Sessão adicionada. Clique em Salvar para guardar as alterações.');
        }
        mostrarSessao();
        marcarRascunhoAlterado();
        if (porId('modal-gerenciar-sessoes').open) renderizarGerenciador();
        porId('modal-criar-sessao').close();
    }

    function limparMarcos() {
        if (!porId('diario-anotacoes').value) return;
        if (!confirm('Limpar os marcos e notas desta sessão? A alteração só será definitiva depois de salvar.')) return;
        porId('diario-anotacoes').value = '';
        marcarRascunhoAlterado();
    }

    function renderizarGerenciador() {
        const lista = porId('lista-gerenciar-sessoes');
        lista.replaceChildren();
        estado.sessoes.forEach((sessao, indice) => {
            const linha = elemento('li', 'linha-gerenciar');
            linha.draggable = true;
            linha.dataset.sessaoId = sessao.id;
            const alca = elemento('span', 'alca-arrastar', '⠿');
            alca.title = 'Arraste esta sessão para mudar sua posição';
            alca.setAttribute('aria-hidden', 'true');
            const detalhes = elemento('div', 'detalhes-sessao-gerenciar');
            detalhes.append(
                elemento('strong', 'numero-sessao-gerenciar', `Sessão ${String(indice + 1).padStart(2, '0')}`),
                elemento('span', 'nome-sessao-gerenciar', sessao.nome || 'Sem título'),
                elemento('small', 'descricao-sessao-gerenciar', sessao.descricao || 'Sem descrição'),
            );
            const acoes = elemento('div', 'acoes-gerenciar');
            const botao = (rotulo, acao, descricao = rotulo) => {
                const b = elemento('button', 'botao botao-pequeno botao-discreto', rotulo);
                b.type = 'button';
                b.setAttribute('aria-label', `${descricao} sessão ${indice + 1}`);
                b.addEventListener('click', acao);
                return b;
            };
            acoes.append(
                botao('↑', () => mudarPosicaoSessao(sessao.id, -1), 'Mover para cima'),
                botao('↓', () => mudarPosicaoSessao(sessao.id, 1), 'Mover para baixo'),
                botao('Editar', () => abrirFormularioSessao(sessao.id)),
                botao('Duplicar', () => {
                    guardarSessaoAtual();
                    const copia = duplicarSessao(estado.sessoes, sessao.id);
                    if (!copia) { mostrarAviso('Limite de sessões atingido.', true); return; }
                    estado.sessaoId = copia.id;
                    mostrarSessao();
                    marcarRascunhoAlterado();
                    renderizarGerenciador();
                }),
                botao('Excluir', () => {
                    if (!confirm(`Excluir a sessão ${indice + 1} — ${sessao.nome || 'Sem título'}?`)) return;
                    const atual = estado.sessaoId;
                    if (atual !== sessao.id) guardarSessaoAtual();
                    estado.sessoes.splice(indice, 1);
                    if (atual === sessao.id) estado.sessaoId = estado.sessoes[Math.min(indice, estado.sessoes.length - 1)]?.id ?? null;
                    mostrarSessao();
                    estado.rascunhoSujo = true;
                    atualizarStatusRascunho();
                    renderizarGerenciador();
                }, 'Excluir'),
            );
            linha.append(alca, detalhes, acoes);
            linha.addEventListener('dragstart', (evento) => {
                evento.dataTransfer.setData('text/plain', sessao.id);
                evento.dataTransfer.effectAllowed = 'move';
                linha.classList.add('arrastando');
            });
            const limparArrasto = () => linha.classList.remove('arrastando', 'sobre', 'inserir-depois');
            linha.addEventListener('dragend', limparArrasto);
            linha.addEventListener('dragover', (evento) => {
                evento.preventDefault();
                evento.dataTransfer.dropEffect = 'move';
                linha.classList.add('sobre');
                const meio = linha.getBoundingClientRect().top + linha.getBoundingClientRect().height / 2;
                linha.classList.toggle('inserir-depois', evento.clientY >= meio);
            });
            linha.addEventListener('dragleave', (evento) => {
                if (!linha.contains(evento.relatedTarget)) limparArrasto();
            });
            linha.addEventListener('drop', (evento) => {
                evento.preventDefault();
                const meio = linha.getBoundingClientRect().top + linha.getBoundingClientRect().height / 2;
                const posicao = evento.clientY >= meio ? 'depois' : 'antes';
                limparArrasto();
                const origem = evento.dataTransfer.getData('text/plain');
                if (!estado.sessoes.some((item) => item.id === origem)) return;
                guardarSessaoAtual();
                if (moverSessao(estado.sessoes, origem, sessao.id, posicao)) {
                    renderizarSeletorSessoes();
                    marcarRascunhoAlterado();
                    renderizarGerenciador();
                }
            });
            lista.append(linha);
        });
        if (!estado.sessoes.length) lista.append(elemento('li', 'sem-resultados', 'Nenhuma sessão. Feche esta janela para adicionar uma.'));
    }

    function mudarPosicaoSessao(id, direcao) {
        const indice = estado.sessoes.findIndex((sessao) => sessao.id === id);
        const destino = estado.sessoes[indice + direcao];
        if (!destino) return;
        guardarSessaoAtual();
        if (moverSessao(estado.sessoes, id, destino.id, direcao > 0 ? 'depois' : 'antes')) {
            renderizarSeletorSessoes();
            marcarRascunhoAlterado();
            renderizarGerenciador();
        }
    }

    function abrirGerenciador() {
        if (!estado.campanhaId || !estado.sessoes.length) return;
        guardarSessaoAtual();
        renderizarGerenciador();
        porId('modal-gerenciar-sessoes').showModal();
    }

    function salvarCampanhaAtual() {
        if (!estado.usuario || !estado.campanhaId) throw new Error('Selecione uma campanha antes de salvar.');
        const { campanhaId, modoLocal, versaoSessao } = estado;
        const usuarioId = estado.usuario.id;
        const carga = numeroCarga;
        const aindaAtual = () => carga === numeroCarga && estado.campanhaId === campanhaId && estado.versaoSessao === versaoSessao;
        if (!modoLocal && escopoCarregado !== `${usuarioId}:${campanhaId}`) {
            throw new Error('As sessões ainda não foram carregadas do Supabase. Aguarde e tente novamente.');
        }
        guardarSessaoAtual();
        const dados = structuredClone({ sessoes: estado.sessoes, ativaId: estado.sessaoId });
        const edicaoSalva = versaoEdicao;

        async function gravar() {
            if (!aindaAtual()) return;
            if (!modoLocal) {
                const revisaoNova = await salvar(campanhaId, dados, idsRemotos, revisaoRemota);
                if (!aindaAtual()) return;
                revisaoRemota = revisaoNova ?? revisaoRemota + 1;
                idsRemotos = new Set(dados.sessoes.map((sessao) => sessao.id));
            }
            const resultado = estado.sessoesRepo.salvar(usuarioId, campanhaId, dados);
            estado.salvoEm = resultado.salvoEm;
            if (edicaoSalva === versaoEdicao) {
                estado.sessoes = resultado.sessoes;
                estado.rascunhoSujo = false;
            }
            atualizarStatusRascunho();
            mostrarAviso(modoLocal ? 'Sessões salvas neste navegador.' : 'Sessões salvas no Supabase e neste navegador.');
        }

        // Salvar pelo Diário e pela Conta usa a mesma fila; cada clique conserva sua própria cópia.
        const gravacao = filaDeGravacao.then(gravar);
        filaDeGravacao = gravacao.catch(() => {});
        return gravacao;
    }

    function iniciarEventos() {
        porId('diario-anotacoes').addEventListener('input', marcarRascunhoAlterado);
        porId('seletor-sessoes').addEventListener('change', (evento) => selecionarSessao(evento.target.value));
        porId('adicionar-sessao').addEventListener('click', () =>
            void executar(porId('adicionar-sessao'), () => abrirFormularioSessao()));
        porId('descricao-nova-sessao').addEventListener('input', atualizarContadorDescricao);
        porId('form-nova-sessao').addEventListener('submit', (evento) => {
            evento.preventDefault();
            void executar(porId('confirmar-sessao'), confirmarFormularioSessao);
        });
        for (const id of ['cancelar-sessao', 'cancelar-sessao-topo']) {
            porId(id).addEventListener('click', () => porId('modal-criar-sessao').close());
        }
        porId('modal-criar-sessao').addEventListener('close', () => {
            estado.sessaoEmEdicaoId = null;
            porId('form-nova-sessao').reset();
        });
        porId('limpar-marcos').addEventListener('click', limparMarcos);
        porId('gerenciar-sessoes').addEventListener('click', abrirGerenciador);
        porId('fechar-gerenciador').addEventListener('click', () => porId('modal-gerenciar-sessoes').close());
        porId('salvar-gerenciador').addEventListener('click', () =>
            void executar(porId('salvar-gerenciador'), async () => {
                await salvarCampanhaAtual();
                porId('modal-gerenciar-sessoes').close();
            }));
        porId('salvar-sessao').addEventListener('click', () =>
            void executar(porId('salvar-sessao'), salvarCampanhaAtual));
    }

    return {
        iniciarEventos,
        atualizarStatusRascunho, guardarSessaoAtual, renderizarSeletorSessoes,
        atualizarHabilitacaoSessoes, mostrarSessao, carregarRascunho,
        marcarRascunhoAlterado, selecionarSessao, atualizarContadorDescricao,
        abrirFormularioSessao, confirmarFormularioSessao, limparMarcos,
        renderizarGerenciador, mudarPosicaoSessao, abrirGerenciador,
        salvarCampanhaAtual,
    };
}
