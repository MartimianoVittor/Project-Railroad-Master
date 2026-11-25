import { confirmar } from '../core/dialogos.js?v=mesa-39';
import { listarNpcsRemotos, gravarNpcRemoto, apagarNpcRemoto } from '../services/conteudoCampanha.js?v=mesa-39';
import { porId, elemento, mensagemLista } from '../core/dom.js?v=mesa-39';
import { iniciarFormularioNpc, lerFormulario, nivelNoFormulario, preencherFormulario, mostrarRetrato } from '../modules/formularioNpc.js?v=mesa-39';
import { ARQUETIPOS_NPC, sortearDadosNpc } from '../modules/npcs/gerador.js?v=mesa-39';
import { rolarTraco } from '../modules/rolagem.js?v=mesa-39';
import { mostrarAviso, executar } from '../core/feedback.js?v=mesa-39';
import {
    LIMITE_NPCS,
    TRACOS_NPC, criarNpc, normalizarNpc, validarNpc,
} from '../modules/npcs.js?v=mesa-39';

/** Criação, consulta, edição e exclusão de NPCs da campanha ativa. */
export function criarControladorNpcs({ estado }, {
    listarRemotos = listarNpcsRemotos,
    gravarRemoto = gravarNpcRemoto,
    apagarRemoto = apagarNpcRemoto,
} = {}) {
    let selecionadoId = null;
    let editando = null;
    let alterado = false;
    let escopoAnterior = '';
    let numeroCarregamento = 0;
    const podeGravarRemoto = () => estado.modoLocal || estado.npcsSincronizados === true;
    const exigirNpcsDisponiveis = () => {
        if (!podeGravarRemoto()) throw new Error('NPCs online indisponíveis. Recarregue a campanha antes de gravar alterações.');
    };
    const escopoAtual = () => `${estado.usuario?.id ?? ''}:${estado.campanhaId ?? ''}`;
    const npcSelecionado = () => estado.npcs.find((npc) => npc.id === selecionadoId);

    // Depois da confirmação da nuvem, falha do backup não pode desfazer em memória
    // a nova revisão e provocar conflitos artificiais na próxima gravação.
    function aplicarListaConfirmada(lista) {
        if (estado.modoLocal) {
            estado.npcs = estado.npcsRepo.salvar(estado.usuario?.id, estado.campanhaId, lista);
            return;
        }
        estado.npcs = lista;
        try { estado.npcsRepo.salvar(estado.usuario?.id, estado.campanhaId, lista); }
        catch (erro) {
            mostrarAviso(`Alterações salvas no Supabase, mas não foi possível atualizar o backup local: ${erro.message}`, true);
        }
    }

    function mostrarModo(modo) {
        porId('npc-vazio').hidden = modo !== 'vazio';
        porId('npc-consulta').hidden = modo !== 'consulta';
        porId('form-npc').hidden = modo === 'vazio';
        porId('form-npc').classList.toggle('npc-modo-consulta', modo === 'consulta');
        porId('npc-rolagem-consulta').hidden = modo === 'vazio';
        // Bloqueia a edição dos dados, preservando os botões de rolagem e munição.
        const consulta = modo === 'consulta';
        porId('form-npc').querySelectorAll('.campos-form-npc input, .campos-form-npc textarea, .campos-form-npc select').forEach((campo) => {
            if (campo.closest('#npc-rolagem-consulta')) return;
            campo.disabled = consulta;
        });
        porId('form-npc').querySelectorAll('.campos-form-npc button').forEach((botao) => {
            if (botao.closest('#npc-rolagem-consulta') || botao.matches('.municao-botao')) return;
            botao.disabled = consulta;
        });
    }

    let salvandoMunicaoConsulta = false;
    async function ajustarMunicao(chave, variacao) {
        const campo = porId(`npc-orig-municao-${chave}`);
        if (!campo) return;
        const atual = Number(campo.value) || 0;
        const proximo = Math.max(0, Math.min(99, atual + variacao));
        if (proximo === atual) return;
        if (editando) {
            campo.value = proximo;
            alterado = true;
            return;
        }
        const npc = npcSelecionado();
        if (!npc) return;
        if (!podeGravarRemoto()) {
            mostrarAviso('NPCs online indisponíveis: consulte os dados locais, mas não altere até recarregar a campanha.', true);
            return;
        }
        const atualizado = structuredClone(npc);
        atualizado.armas[chave].municao = proximo;
        if (salvandoMunicaoConsulta) return;
        salvandoMunicaoConsulta = true;
        const campanha = estado.campanhaId;
        try {
            if (!estado.modoLocal && campanha) {
                // Consulta do NPC também grava no Supabase, não apenas no navegador.
                atualizado.revisao = await gravarRemoto(campanha, atualizado);
            }
            if (estado.campanhaId !== campanha) return;
            const lista = estado.npcs.map((item) => item.id === npc.id ? atualizado : item);
            aplicarListaConfirmada(lista);
            if (!editando && selecionadoId === npc.id) campo.value = proximo;
        } catch (erro) {
            mostrarAviso(`Não foi possível salvar a munição: ${erro.message}`, true);
        } finally {
            salvandoMunicaoConsulta = false;
        }
    }

    function rolarNpcSelecionado() {
        const npc = npcSelecionado();
        if (!npc && !editando) return;
        const nome = porId('npc-rolagem-traco').value;
        const nivelAtual = editando
            ? nivelNoFormulario(nome)
            : Number(npc?.tracos?.[nome]) || 0;
        const nivel = Math.max(0, Math.min(4, nivelAtual));
        const modificador = Number(porId('npc-rolagem-modificador').value) || 0;
        const resultado = porId('npc-rolagem-resultado');
        if (nivel === 0) {
            resultado.textContent = `${nome}: falha automática (nível 0).`;
            return;
        }
        const { faces, dados, soma } = rolarTraco(nivel);
        resultado.textContent = `${nome} (d${faces}): ${dados.join(' + ')} ${modificador < 0 ? '−' : '+'} ${Math.abs(modificador)} = ${soma + modificador}`;
    }

    function mostrarLista() {
        const lista = porId('lista-npcs');
        const busca = porId('buscar-npc').value.trim().toLocaleLowerCase('pt-BR');
        lista.replaceChildren();
        porId('total-npcs').textContent = String(estado.npcs.length);
        for (const npc of estado.npcs) {
            if (busca && !`${npc.nome} ${npc.papel} ${npc.apelido}`.toLocaleLowerCase('pt-BR').includes(busca)) continue;
            const item = elemento('li', `item-npc${npc.id === selecionadoId ? ' ativo' : ''}`);
            const botao = elemento('button');
            botao.type = 'button';
            botao.setAttribute('aria-pressed', String(npc.id === selecionadoId));
            botao.append(
                elemento('strong', '', npc.nome),
                elemento('small', '', npc.papel || 'Sem função definida'),
                elemento('span', 'npc-tipo-lista', npc.tipo === 'completa' ? 'Completa' : 'Simplificada'),
            );
            botao.addEventListener('click', () => selecionarNpc(npc.id));
            item.append(botao);
            lista.append(item);
        }
        if (!lista.children.length) mensagemLista(lista, estado.campanhaId
            ? !podeGravarRemoto() ? 'NPCs online indisponíveis. Exibindo apenas os dados locais disponíveis.'
                : busca ? 'Nenhum NPC corresponde à busca.' : 'Nenhum NPC criado nesta campanha.'
            : 'Selecione uma campanha para consultar os NPCs.');
    }

    function renderizarConsulta() {
        const npc = npcSelecionado();
        if (!npc) {
            mostrarModo('vazio');
            porId('npc-vazio').querySelector('p').textContent = estado.campanhaId
                ? 'Crie um NPC ou selecione uma ficha na lista para consultá-la.'
                : 'Selecione uma campanha para consultar ou criar NPCs.';
            return;
        }
        preencherFormulario(npc);
        mostrarModo('consulta');
        porId('form-npc').querySelectorAll('.municao-botao').forEach((botao) => {
            botao.disabled = !podeGravarRemoto();
        });
        porId('npc-nome-consulta').textContent = npc.nome;
        porId('form-npc').querySelector('.campos-form-npc').scrollTop = 0;
    }

    function atualizarContexto() {
        const habilitado = Boolean(estado.usuario?.id && estado.campanhaId);
        porId('novo-npc').disabled = !habilitado || !podeGravarRemoto();
        porId('editar-npc').disabled = !habilitado || !podeGravarRemoto();
        porId('excluir-npc').disabled = !habilitado || !podeGravarRemoto();
        porId('buscar-npc').disabled = !habilitado;
        porId('contexto-npcs').textContent = !habilitado
            ? 'Selecione uma campanha para criar NPCs.'
            : !podeGravarRemoto() ? 'Sem confirmação da nuvem. Cópia local disponível apenas para consulta; tente recarregar a campanha.' : '';
    }

    async function carregarCampanha() {
        const carga = ++numeroCarregamento;
        const campanhaId = estado.campanhaId;
        const escopo = escopoAtual();
        const mudou = escopo !== escopoAnterior;
        escopoAnterior = escopo;
        const aindaAtual = () => carga === numeroCarregamento && escopo === escopoAtual();
        const local = estado.npcsRepo?.carregar(estado.usuario?.id, campanhaId) ?? [];
        estado.npcs = local;
        estado.npcsSincronizados = Boolean(estado.modoLocal);
        if (!estado.modoLocal && campanhaId && estado.usuario?.id) {
            try {
                const remotos = await listarRemotos(campanhaId);
                if (!aindaAtual()) return;
                const ids = new Set(remotos.map((n) => n.id));
                const ausentes = local.filter((n) => !ids.has(n.id));
                // NPCs locais com revisão anterior podem ter sido excluídos remotamente.
                // Não recriá-los silenciosamente.
                const nuncaEnviados = ausentes.filter((n) => !n.revisao);
                if (nuncaEnviados.length && await confirmar(`Há ${nuncaEnviados.length} NPC(s) novos guardados apenas neste navegador. Importar para a campanha no Supabase?`)) {
                    for (const npc of nuncaEnviados) {
                        npc.revisao = await gravarRemoto(campanhaId, npc);
                        if (!aindaAtual()) return;
                        remotos.push(npc);
                    }
                }
                if (!aindaAtual()) return;
                estado.npcs = remotos;
                estado.npcsSincronizados = true;
                // Falha no cache não descarta registros já lidos na nuvem.
                try { estado.npcsRepo.salvar(estado.usuario?.id, campanhaId, remotos); }
                catch (erro) { mostrarAviso(`NPCs carregados, mas o backup local falhou: ${erro.message}`, true); }
                if (ausentes.some((n) => n.revisao > 0)) {
                    mostrarAviso('Há NPCs antigos no backup local que não existem mais na nuvem. Eles não foram recriados.', true);
                }
            } catch (erro) {
                if (!aindaAtual()) return;
                mostrarAviso(`Não foi possível carregar os NPCs do Supabase: ${erro.message}. A cópia local foi preservada apenas para consulta.`, true);
                // Não confundir falha de rede com uma campanha sem NPCs.
                estado.npcs = local;
                estado.npcsSincronizados = false;
            }
        }
        if (!aindaAtual()) return;
        if (mudou) {
            selecionadoId = null;
            editando = null;
            alterado = false;
            porId('buscar-npc').value = '';
        }
        if (!estado.npcs.some((npc) => npc.id === selecionadoId)) selecionadoId = null;
        atualizarContexto();
        mostrarLista();
        renderizarConsulta();
    }

    function temAlteracoesPendentes() { return Boolean(editando && alterado); }

    async function confirmarSaida() {
        return !temAlteracoesPendentes() || await confirmar(
            'A ficha de NPC tem alterações não salvas. Deseja descartá-las?'
        );
    }

    function descartarEdicao() {
        fecharGerador();
        editando = null;
        alterado = false;
        mostrarLista();
        renderizarConsulta();
    }

    async function selecionarNpc(id) {
        if (!estado.npcs.some((npc) => npc.id === id) || !(await confirmarSaida())) return;
        editando = null;
        alterado = false;
        selecionadoId = id;
        mostrarLista();
        renderizarConsulta();
    }

    function iniciarEdicao(npc, novo) {
        editando = structuredClone(npc);
        alterado = false;
        porId('titulo-form-npc').textContent = novo ? 'Criar NPC' : 'Editar NPC';
        preencherFormulario(npc);
        mostrarModo('edicao');
        porId('npc-orig-nome-personagem').focus();
    }

    async function criarNovo() {
        exigirNpcsDisponiveis();
        if (!estado.campanhaId) throw new Error('Selecione uma campanha antes de criar NPCs.');
        if (estado.npcs.length >= LIMITE_NPCS) throw new Error(`Limite de ${LIMITE_NPCS} NPCs atingido.`);
        if (!(await confirmarSaida())) return;
        iniciarEdicao(criarNpc('completa'), true);
    }

    function editarSelecionado() {
        exigirNpcsDisponiveis();
        const npc = npcSelecionado();
        if (!npc) return;
        iniciarEdicao(npc, false);
    }

    async function salvarNpc() {
        if (!editando) return;
        exigirNpcsDisponiveis();
        const npc = validarNpc(normalizarNpc(lerFormulario(editando)));
        npc.atualizadoEm = new Date().toISOString();
        const existe = estado.npcs.some((item) => item.id === npc.id);
        const campanhaId = estado.campanhaId;
        const versaoSessao = estado.versaoSessao;
        const lista = existe
            ? estado.npcs.map((item) => item.id === npc.id ? npc : item)
            : [...estado.npcs, npc];
        // A lista em memória só muda depois que a gravação local teve sucesso.
        if (!estado.modoLocal) npc.revisao = await gravarRemoto(campanhaId, npc);
        if (estado.campanhaId !== campanhaId || estado.versaoSessao !== versaoSessao) return;
        aplicarListaConfirmada(lista);
        selecionadoId = npc.id;
        editando = null;
        alterado = false;
        mostrarLista();
        renderizarConsulta();
        mostrarAviso(estado.modoLocal ? 'Ficha de NPC salva neste navegador.' : 'Ficha de NPC salva no Supabase.');
    }

    async function salvarEdicaoPendente() {
        if (!editando) return;
        if (!porId('form-npc').reportValidity()) {
            throw new Error('Preencha os campos obrigatórios do NPC antes de salvar.');
        }
        await salvarNpc();
    }

    async function excluirSelecionado() {
        exigirNpcsDisponiveis();
        const npc = npcSelecionado();
        if (!npc || !await confirmar(`Excluir a ficha de NPC “${npc.nome}”? Esta ação não pode ser desfeita.`)) return;
        const escopo = escopoAtual();
        if (!estado.modoLocal) await apagarRemoto(estado.campanhaId, npc.id, npc.revisao);
        if (escopoAtual() !== escopo) return;
        aplicarListaConfirmada(estado.npcs.filter((item) => item.id !== npc.id));
        selecionadoId = null;
        mostrarLista();
        renderizarConsulta();
        mostrarAviso('NPC excluído desta campanha.');
    }

    function fecharGerador() {
        const modal = porId('modal-gerador-npc');
        if (modal.open) modal.close();
    }

    function abrirGerador() {
        if (!editando) return;
        const jaExiste = estado.npcs.some((npc) => npc.id === editando.id);
        porId('gerar-salvar-npc').hidden = jaExiste;
        porId('modal-gerador-npc').showModal();
    }

    function opcoesGerador() {
        return {
            arquetipo: porId('npc-gerador-arquetipo').value,
            pontos: Number(porId('npc-gerador-pontos').value),
            personalidade: porId('npc-gerador-personalidade').value,
            objetivo: porId('npc-gerador-objetivo').value,
            equipamento: porId('npc-gerador-equipamento').value,
            preservarItens: porId('npc-gerador-preservar-itens').checked,
        };
    }

    /** Aplica as escolhas apenas na confirmação; o botão de cancelar não modifica a ficha. */
    async function gerarNpcAleatorio(salvarImediatamente = false) {
        if (!editando) return;
        const jaExiste = estado.npcs.some((npc) => npc.id === editando.id);
        if ((jaExiste || alterado) && !await confirmar(
            'Substituir os dados preenchidos na ficha pelos dados de um NPC gerado?'
        )) return;
        const ficha = sortearDadosNpc(lerFormulario(editando), opcoesGerador());
        editando = ficha;
        preencherFormulario(ficha);
        alterado = true;
        fecharGerador();
        if (salvarImediatamente && !jaExiste) {
            // Mantém a ficha preenchida em edição caso a persistência falhe.
            await salvarNpc();
        } else {
            mostrarAviso('Ficha gerada. Confira os dados e clique em Salvar NPC.');
        }
    }

    function iniciarEventos() {
        const seletorArquetipos = porId('npc-gerador-arquetipo');
        seletorArquetipos.append(...ARQUETIPOS_NPC.map(({ id, rotulo }) => {
            const opcao = document.createElement('option');
            opcao.value = id;
            opcao.textContent = rotulo;
            return opcao;
        }));
        porId('abrir-gerador-npc').addEventListener('click', abrirGerador);
        porId('fechar-gerador-npc').addEventListener('click', fecharGerador);
        porId('cancelar-gerador-npc').addEventListener('click', fecharGerador);
        porId('modal-gerador-npc').addEventListener('close', () => {
            if (editando && !porId('form-npc').hidden) porId('abrir-gerador-npc').focus();
        });
        porId('gerar-npc-aleatorio').addEventListener('click', () =>
            void executar(porId('gerar-npc-aleatorio'), () => gerarNpcAleatorio(false)));
        porId('gerar-salvar-npc').addEventListener('click', () =>
            void executar(porId('gerar-salvar-npc'), () => gerarNpcAleatorio(true)));
        iniciarFormularioNpc();
        porId('npc-orig-escolher-foto-personagem').addEventListener('change', (evento) => {
            const arquivo = evento.target.files?.[0];
            if (!arquivo || !editando) return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type) || arquivo.size > 350 * 1024) {
                evento.target.value = '';
                mostrarAviso('Imagem JPG, PNG ou WebP de até 350 KB.');
                return;
            }
            const ficha = editando;
            const leitor = new FileReader();
            leitor.onload = () => {
                if (editando !== ficha) return;
                ficha.imagem = String(leitor.result || '');
                mostrarRetrato(ficha.imagem);
                alterado = true;
            };
            leitor.readAsDataURL(arquivo);
        });
        const seletorRolagem = porId('npc-rolagem-traco');
        seletorRolagem.replaceChildren(...TRACOS_NPC.map((nome) => {
            const opcao = document.createElement('option');
            opcao.value = nome;
            opcao.textContent = nome;
            return opcao;
        }));
        porId('npc-rolar').addEventListener('click', rolarNpcSelecionado);
        document.querySelectorAll('#form-npc .municao-botao').forEach((botao) => {
            botao.addEventListener('click', () => ajustarMunicao(botao.dataset.municao, Number(botao.dataset.variacao)));
        });
        porId('novo-npc').addEventListener('click', () => void executar(porId('novo-npc'), criarNovo));
        porId('buscar-npc').addEventListener('input', mostrarLista);
        porId('editar-npc').addEventListener('click', editarSelecionado);
        porId('excluir-npc').addEventListener('click', () => void executar(porId('excluir-npc'), excluirSelecionado));
        porId('cancelar-npc').addEventListener('click', async () => {
            if (await confirmarSaida()) descartarEdicao();
        });
        porId('form-npc').addEventListener('input', () => { if (editando) alterado = true; });
        porId('form-npc').addEventListener('change', () => { if (editando) alterado = true; });
        // Somente fichas completas; não há alternância de tipo.
        porId('form-npc').addEventListener('submit', (evento) => {
            evento.preventDefault();
            void executar(porId('salvar-npc'), salvarNpc);
        });
        atualizarContexto();
        mostrarLista();
        renderizarConsulta();
    }

    return {
        iniciarEventos, carregarCampanha, confirmarSaida, descartarEdicao,
        salvarEdicaoPendente, temAlteracoesPendentes,
    };
}
