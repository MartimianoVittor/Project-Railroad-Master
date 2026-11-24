import { elemento, porId } from '../core/dom.js?v=mesa-34';
import { mostrarAviso } from '../core/feedback.js?v=mesa-34';
import { listarPersonagensDisponiveis } from '../modules/personagensCampanha.js?v=mesa-34';
import { criarGrupo, distanciaDoDia, normalizarViagens, novoId, inteiroNaoNegativo } from '../modules/viagem/modelo.js?v=mesa-34';
import { mostrarPainelViagem } from '../modules/viagem/painel.js?v=mesa-34';
import { iniciarSeletorViajante } from '../modules/viagem/seletorViajante.js?v=mesa-34';
import { mostrarViajante } from '../modules/viagem/viajante.js?v=mesa-34';
import { criarSincronizadorEstadoMesa } from '../services/estadosMesa.js?v=mesa-34';

export function criarControladorViagem({ estado }) {
    let chaveArmazenamento = '';
    let dados = normalizarViagens(null);
    let selecionado = '';
    let fichasPorViajante = new Map();
    let confirmarDialogo = null;
    let abrirEdicaoViajante;
    const viagem = () => dados.viagens.find(viagemAtual => viagemAtual.id === dados.ativa) || null;
    const grupo = () => {
        const viagemAtual = viagem();
        return viagemAtual?.grupos.find(grupoAtual => grupoAtual.id === viagemAtual.ativo) || null;
    };
    const preservarLocal = () => {
        if (!chaveArmazenamento)
            return;
        try {
            localStorage.setItem(chaveArmazenamento, JSON.stringify(dados));
        } catch (e) {
            alert('Falha ao salvar viagens no navegador: ' + e.message);
        }
    };
    const salvar = () => {
        preservarLocal();
        sincronizador.agendar();
    };
    const sincronizador = criarSincronizadorEstadoMesa({
        estado,
        tipo: 'viagens',
        obterDados: () => dados,
        aplicarDados: conteudo => {
            dados = normalizarViagens(conteudo);
            selecionado = '';
            renderizar();
        },
        temConteudo: conteudo => Array.isArray(conteudo?.viagens) && conteudo.viagens.length > 0,
        preservarLocal,
        aoBloqueio: bloqueado => { porId('vg-sincronizar').hidden = !bloqueado; },
        avisar: mensagem => {
            console.warn(mensagem);
            mostrarAviso(mensagem, true);
        }
    });

    function atualizar() {
        const nova = estado.campanhaId && estado.usuario?.id ? `railroad-viagens:v2:${estado.usuario.id}:${estado.campanhaId}` : '';
        if (chaveArmazenamento !== nova) {
            chaveArmazenamento = nova;
            selecionado = '';
            fichasPorViajante = new Map();
            nomesJogadores.clear();
            try {
                const atual = chaveArmazenamento ? JSON.parse(localStorage.getItem(chaveArmazenamento) || 'null') : null;
                const anterior = chaveArmazenamento && !atual ? JSON.parse(localStorage.getItem(chaveArmazenamento.replace(':v2:', ':v1:')) || 'null') : null;
                dados = normalizarViagens(atual || anterior);
                if (anterior && !atual)
                    salvar();
            } catch {
                dados = normalizarViagens(null);
            }
        }
        renderizar();
        void sincronizador.ativar();
    }

    function renderizar() {
        mostrarPainelViagem({
            viagens: dados.viagens,
            viagem: viagem(),
            grupo: grupo(),
            temCampanha: Boolean(chaveArmazenamento),
            selecionado,
            aoSelecionar(viajante) {
                selecionado = viajante.id;
                renderizar();
                void buscarFicha(viajante);
            },
            aoEditar: abrirEdicaoViajante,
            aoRemover(viajante) {
                if (!confirm(`Remover ${viajante.nome} do grupo?`))
                    return;
                const atual = grupo();
                atual.viajantes = atual.viajantes.filter(item => item.id !== viajante.id);
                if (selecionado === viajante.id)
                    selecionado = '';
                salvar();
                renderizar();
            },
        });
        detalhe();
    }

    function abrirDialogo(titulo, rotulo, valor, tipo, aoConfirmar, {nome = null, excluir = false } = {}) {
        confirmarDialogo = aoConfirmar;
        porId('vg-dialog-titulo').textContent = titulo;
        porId('vg-dialog-label').textContent = rotulo;
        const campo = porId('vg-campo');
        campo.type = tipo;
        campo.value = valor;
        campo.min = tipo === 'number' ? '1' : '';
        campo.step = tipo === 'number' ? '1' : '';
        campo.maxLength = tipo === 'text' ? 80 : 524288;
        const linha = porId('vg-nome-linha');
        const nomeCampo = porId('vg-nome');
        linha.hidden = nome === null;
        nomeCampo.disabled = nome === null;
        nomeCampo.required = nome !== null;
        nomeCampo.value = nome ?? '';
        porId('vg-excluir-viagem').hidden = !excluir;
        porId('vg-dialog').showModal();
        (nome !== null ? nomeCampo : campo).focus();
    }
    const nomesJogadores = new Map();

    function disponiveis() {
        return listarPersonagensDisponiveis(estado, nomesJogadores);
    }

    async function buscarFicha(viajante) {
        if (viajante.tipo !== 'jogador' || fichasPorViajante.has(viajante.id) || !estado.repositorio?.obterFicha)
            return;
        const campanhaId = estado.campanhaId;
        try {
            const ficha = await estado.repositorio.obterFicha(campanhaId, viajante.ref);
            if (estado.campanhaId !== campanhaId)
                return;
            fichasPorViajante.set(viajante.id, ficha);
            if (ficha?.dados?.nome?.trim())
                nomesJogadores.set(viajante.ref, ficha.dados.nome.trim());
            if (selecionado === viajante.id)
                detalhe();
        } catch (e) {
            if (estado.campanhaId === campanhaId && selecionado === viajante.id)
                porId('vg-detalhe').append(elemento('p', '', 'Erro ao consultar ficha: ' + e.message));
        }
    }

    function detalhe() {
        const viajante = grupo()?.viajantes.find(pessoa => pessoa.id === selecionado);
        const npc = viajante?.tipo === 'npc' ? estado.npcs.find(n => n.id === viajante.ref) : null;
        mostrarViajante(viajante, npc || {}, fichasPorViajante.get(viajante?.id), salvar);
    }

    async function carregarNomesJogadores() {
        if (!estado.repositorio?.obterFicha || !estado.campanhaId)
            return;
        const campanha = estado.campanhaId;
        const pendentes = disponiveis().filter(viajante => viajante.tipo === 'jogador' && !nomesJogadores.has(viajante.ref));
        await Promise.all(pendentes.map(async viajante => {
            try {
                const ficha = await estado.repositorio.obterFicha(campanha, viajante.ref);
                if (estado.campanhaId === campanha) {
                    fichasPorViajante.set(viajante.id, ficha);
                    const nome = ficha?.dados?.nome?.trim();
                    if (nome)
                        nomesJogadores.set(viajante.ref, nome);
                }
            } catch {}
        }));
    }

    function iniciarEventos() {
        porId('vg-sincronizar').addEventListener('click', () => void sincronizador.tentarNovamente());
        porId('vg-criar').onclick = () => abrirDialogo('Criar viagem', 'Distância total (km)', '', 'number', (valor, nome) => {
            const titulo = nome.trim();
            if (!titulo)
                return false;
            const primeiro = criarGrupo('Grupo 1');
            const viagemAtual = {
                id: novoId(),
                nome: titulo.slice(0, 80),
                total: inteiroNaoNegativo(valor),
                grupos: [primeiro],
                ativo: primeiro.id
            };
            dados.viagens.push(viagemAtual);
            dados.ativa = viagemAtual.id;
            selecionado = '';
            salvar();
            renderizar();
        }, {
            nome: `Viagem ${dados.viagens.length + 1}`
        });
        porId('vg-editar').onclick = () => {
            const viagemAtual = viagem();
            if (!viagemAtual)
                return;
            abrirDialogo('Modificar viagem', 'Distância total (km)', viagemAtual.total || '', 'number', (valor, nome) => {
                if (!nome.trim())
                    return false;
                viagemAtual.nome = nome.trim().slice(0, 80);
                viagemAtual.total = inteiroNaoNegativo(valor);
                salvar();
                renderizar();
            }, {
                nome: viagemAtual.nome,
                excluir: true
            });
        };
        porId('vg-excluir-viagem').onclick = () => {
            const viagemAtual = viagem();
            if (!viagemAtual)
                return;
            if (!confirm(`Excluir a viagem "${viagemAtual.nome}" e todos os seus grupos, viajantes e progressos? As demais viagens serão preservadas.`))
                return;
            dados.viagens = dados.viagens.filter(item => item.id !== viagemAtual.id);
            dados.ativa = dados.viagens[0]?.id || null;
            selecionado = '';
            salvar();
            porId('vg-dialog').close();
            renderizar();
        };
        porId('vg-adicionar-grupo').onclick = () => {
            const viagemAtual = viagem();
            if (!viagemAtual)
                return;
            abrirDialogo('Adicionar grupo', 'Nome do grupo', `Grupo ${viagemAtual.grupos.length + 1}`, 'text', valor => {
                if (!valor.trim())
                    return false;
                const grupoAtual = criarGrupo(valor.trim().slice(0, 80));
                viagemAtual.grupos.push(grupoAtual);
                viagemAtual.ativo = grupoAtual.id;
                selecionado = '';
                salvar();
                renderizar();
            });
        };
        porId('vg-excluir-grupo').onclick = () => {
            const viagemAtual = viagem();
            const grupoAtual = grupo();
            if (!viagemAtual || !grupoAtual || !confirm(`Excluir ${grupoAtual.nome} e seu progresso nesta viagem?`))
                return;
            viagemAtual.grupos = viagemAtual.grupos.filter(item => item.id !== grupoAtual.id);
            viagemAtual.ativo = viagemAtual.grupos[0]?.id || null;
            selecionado = '';
            salvar();
            renderizar();
        };
        porId('vg-viagem').onchange = evento => {
            dados.ativa = evento.target.value;
            selecionado = '';
            salvar();
            renderizar();
        };
        porId('vg-grupo').onchange = evento => {
            const viagemAtual = viagem();
            if (!viagemAtual)
                return;
            viagemAtual.ativo = evento.target.value;
            selecionado = '';
            salvar();
            renderizar();
        };
        for (const [id, campo] of [['vg-ritmo', 'ritmo'], ['vg-busca', 'busca']])
            porId(id).onchange = evento => {
                const grupoAtual = grupo();
                if (grupoAtual) {
                    grupoAtual[campo] = evento.target.value;
                    salvar();
                    renderizar();
                }
            };
        porId('vg-descansar').onclick = () => {
            const grupoAtual = grupo();
            if (grupoAtual) {
                grupoAtual.desde = 0;
                salvar();
                renderizar();
            }
        };
        porId('vg-viajar').onclick = () => {
            const viagemAtual = viagem();
            const grupoAtual = grupo();
            if (!viagemAtual || !grupoAtual)
                return;
            const distancia = distanciaDoDia(viagemAtual, grupoAtual);
            if (!distancia)
                return;
            grupoAtual.percorrido = inteiroNaoNegativo(grupoAtual.percorrido) + inteiroNaoNegativo(distancia);
            grupoAtual.desde = inteiroNaoNegativo(grupoAtual.desde) + inteiroNaoNegativo(distancia);
            salvar();
            renderizar();
        };
        abrirEdicaoViajante = iniciarSeletorViajante({
            grupo,
            disponiveis,
            carregarNomesJogadores,
            aoConfirmar(viajante) {
                selecionado = viajante.id;
                salvar();
                renderizar();
                void buscarFicha(viajante);
            }
        });
        porId('vg-cancelar').onclick = () => porId('vg-dialog').close();
        porId('vg-form').onsubmit = evento => {
            evento.preventDefault();
            const c = porId('vg-campo');
            const nome = porId('vg-nome');
            if (!c.reportValidity() || (c.type === 'number' && !(Number(c.value) > 0)))
                return;
            if (!nome.disabled && (!nome.reportValidity() || !nome.value.trim()))
                return;
            if (confirmarDialogo?.(c.value, nome.disabled ? '' : nome.value) !== false)
                porId('vg-dialog').close();
        };
    }
    return {
        atualizar,
        iniciarEventos
    };
}
