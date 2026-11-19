import { listarSessoesRemotas, salvarSessoesRemotas } from '../services/conteudoCampanha.js';
import { criarSessao, duplicarSessao, moverSessao } from '../modules/sessoes.js';
import { mostrarAviso } from '../core/feedback.js';
import { porId, elemento } from '../core/dom.js';

/** Sessões, edição, reordenação e persistência local do diário. */
export function criarControladorDiario({ estado }) {
    let idsRemotos = new Set();
    let escopoCarregado = null;
    function atualizarStatusRascunho() {
        const indicador = porId('status-rascunho');
        indicador.classList.toggle('pendente', estado.rascunhoSujo);

        if (!estado.campanhaId) {
            indicador.textContent = 'Selecione uma campanha para editar o diário.';
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
        const temCampanha = Boolean(estado.campanhaId);
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
        const dados = estado.sessoesRepo.carregar(estado.usuario?.id, estado.campanhaId);
        estado.sessoes = dados.sessoes;
        estado.sessaoId = dados.ativaId;
        estado.rascunhoSujo = false;
        estado.salvoEm = dados.salvoEm;
        mostrarSessao();
        atualizarStatusRascunho();
        idsRemotos = new Set();
        const escopo = `${estado.usuario?.id}:${estado.campanhaId}`;
        escopoCarregado = null;
        if (!estado.modoLocal && estado.campanhaId && estado.usuario?.id) {
            try {
                const remoto = await listarSessoesRemotas(estado.campanhaId);
                if (escopo !== `${estado.usuario?.id}:${estado.campanhaId}`) return;
                const ids = new Set(remoto.sessoes.map(s=>s.id));
                const locaisAusentes = dados.sessoes.filter(s=>!ids.has(s.id));
                if (locaisAusentes.length && confirm(`Há ${locaisAusentes.length} sessão(ões) guardada(s) apenas neste navegador. Importar para o Supabase?`)) {
                    remoto.sessoes.push(...locaisAusentes);
                    remoto.ativaId ||= dados.ativaId;
                    // A importação não apaga nem substitui sessões remotas.
                    await salvarSessoesRemotas(estado.campanhaId,remoto,new Set());
                    if (escopo !== `${estado.usuario?.id}:${estado.campanhaId}`) return;
                }
                estado.sessoes=remoto.sessoes;
                estado.sessaoId=remoto.ativaId;
                estado.salvoEm=remoto.salvoEm;
                idsRemotos=new Set(remoto.sessoes.map(s=>s.id));
                escopoCarregado=escopo;
                mostrarSessao();atualizarStatusRascunho();
            } catch(erro) {
                if (escopo !== `${estado.usuario?.id}:${estado.campanhaId}`) return;
                estado.sessoes=[];estado.sessaoId=null;
                mostrarSessao();
                mostrarAviso(`Não foi possível carregar as sessões do Supabase: ${erro.message}`,true);
            }
        }
    }

    function marcarRascunhoAlterado() {
        if (!estado.campanhaId || !estado.sessaoId) return;
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
        if (caracteres.length > 25) campo.value = caracteres.slice(0, 25).join('');
        porId('contador-descricao-sessao').textContent = `${Array.from(campo.value).length}/25`;
    }

    function abrirFormularioSessao(id = null) {
        if (!estado.campanhaId) throw new Error('Selecione uma campanha antes de criar sessões.');
        if (!id && estado.sessoes.length >= 200) throw new Error('Limite de 200 sessões por campanha.');
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
        const nome = Array.from(porId('nome-nova-sessao').value.trim()).slice(0, 80).join('');
        const descricao = Array.from(porId('descricao-nova-sessao').value.trim()).slice(0, 25).join('');
        if (!nome) throw new Error('Informe um nome para a sessão.');
        guardarSessaoAtual();

        if (estado.sessaoEmEdicaoId) {
            const sessao = estado.sessoes.find((item) => item.id === estado.sessaoEmEdicaoId);
            if (!sessao) throw new Error('Sessão não encontrada.');
            sessao.nome = nome;
            sessao.descricao = descricao;
            mostrarAviso('Dados da sessão alterados. Clique em Salvar para guardar.');
        } else {
            if (estado.sessoes.length >= 200) throw new Error('Limite de 200 sessões por campanha.');
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

    async function salvarCampanhaAtual() {
        if (!estado.usuario || !estado.campanhaId) throw new Error('Selecione uma campanha antes de salvar.');
        guardarSessaoAtual();
        const dados = {sessoes:estado.sessoes,ativaId:estado.sessaoId};
        if (!estado.modoLocal) {
            if (escopoCarregado !== `${estado.usuario.id}:${estado.campanhaId}`)
                throw new Error('As sessões ainda não foram carregadas do Supabase. Aguarde e tente novamente.');
            await salvarSessoesRemotas(estado.campanhaId,dados,idsRemotos);
            idsRemotos = new Set(estado.sessoes.map(s=>s.id));
        }
        const resultado = estado.sessoesRepo.salvar(estado.usuario.id, estado.campanhaId, dados);
        estado.sessoes = resultado.sessoes;
        estado.rascunhoSujo = false;
        estado.salvoEm = resultado.salvoEm;
        atualizarStatusRascunho();
        mostrarAviso(estado.modoLocal ? 'Sessões salvas neste navegador.' : 'Sessões salvas no Supabase e neste navegador.');
    }

    return {
        atualizarStatusRascunho, guardarSessaoAtual, renderizarSeletorSessoes,
        atualizarHabilitacaoSessoes, mostrarSessao, carregarRascunho,
        marcarRascunhoAlterado, selecionarSessao, atualizarContadorDescricao,
        abrirFormularioSessao, confirmarFormularioSessao, limparMarcos,
        renderizarGerenciador, mudarPosicaoSessao, abrirGerenciador,
        salvarCampanhaAtual,
    };
}
