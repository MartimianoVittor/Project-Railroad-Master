import { obterCliente, entrarComGoogle, sairDaConta, iniciarAutenticacao } from './core/cliente.js';
import { criarRepositorioCampanhas } from './services/campanhas.js';
import { criarRepositorioCampanhasLocal } from './services/campanhasLocal.js';
import { criarRepositorioSessoes } from './modules/sessoes.js';
import { criarRepositorioNpcs } from './services/npcsLocal.js';
import { iniciarQuadroMestre } from './modules/quadroMestre.js';
import { criarNavegacao } from './modules/navegacao.js';
import { mostrarAviso, executar } from './core/feedback.js';
import { carregarInterface } from './core/carregarInterface.js';
import { porId } from './core/dom.js';
import { estado } from './app/estado.js';
import { criarControladorDiario } from './controllers/diario.js';
import { criarControladorCampanhas } from './controllers/campanhas.js';
import { criarControladorFichas } from './controllers/fichas.js';
import { criarControladorNpcs } from './controllers/npcs.js';

// A composição é feita uma única vez; os módulos compartilham o estado da mesa.
const contexto = { estado };
contexto.diario = criarControladorDiario(contexto);
contexto.fichas = criarControladorFichas(contexto);
contexto.npcs = criarControladorNpcs(contexto);
contexto.campanhas = criarControladorCampanhas(contexto);

const {
    carregarRascunho, marcarRascunhoAlterado, selecionarSessao,
    atualizarContadorDescricao, abrirFormularioSessao, confirmarFormularioSessao,
    limparMarcos, abrirGerenciador, salvarCampanhaAtual,
} = contexto.diario;
const {
    listarCampanhas, listarParticipantes, mostrarCampanha, mostrarFormularioConvite,
    atualizarCampanhas, criarCampanha, convidarJogador,
} = contexto.campanhas;
const { listarEnvios } = contexto.fichas;

async function quandoSessaoMudar(usuario, local = false) {
    if (estado.modoLocal && !local) return;
    if (usuario?.id === estado.usuario?.id && local === estado.modoLocal) return;
    estado.modoLocal = local;
    document.body.classList.toggle('modo-local', local);

    estado.versaoSessao++;
    estado.versaoLista++;
    estado.versaoCampanha++;
    estado.usuario = usuario;
    // A tela de login precisa permitir rolagem mesmo no desktop.
    // Após autenticar, as abas voltam ao layout fixo com rolagem interna.
    document.documentElement.classList.toggle('modo-entrada', !usuario);
    document.body.classList.toggle('modo-entrada', !usuario);
    if (!usuario) document.body.classList.remove('fichas-ativas');
    estado.campanhas = [];
    estado.campanhaId = null;
    estado.participantes = [];
    estado.envios = [];
    estado.npcs = [];
    estado.rascunhoSujo = false;
    estado.salvoEm = null;
    estado.sessoes = [];
    estado.sessaoId = null;
    porId('nome-campanha').value = '';
    porId('descricao-campanha').value = '';
    porId('codigo-jogador').value = '';
    carregarRascunho();
    listarCampanhas();
    listarParticipantes();
    listarEnvios();
    contexto.npcs.carregarCampanha();
    mostrarCampanha();
    mostrarFormularioConvite(false);

    porId('tela-entrada').hidden = Boolean(usuario);
    porId('painel').hidden = !usuario;
    porId('navegacao-mestre').hidden = !usuario;
    porId('salvar-campanha').hidden = !usuario;
    porId('sair').hidden = !usuario;
    porId('usuario-email').hidden = !usuario;
    porId('usuario-email').textContent = local ? 'Modo local' : (usuario?.email ?? '');

    if (usuario) {
        estado.navegacao.abrir('campanhas');
        try { await atualizarCampanhas(); }
        catch (erro) { mostrarAviso(`Não foi possível carregar suas campanhas: ${erro.message}`, true); }
    }
}

async function iniciar() {
    try {
        await carregarInterface();
    } catch (erro) {
        const mensagem = `Não foi possível carregar a interface: ${erro.message} Abra o projeto pelo Live Server.`;
        document.querySelector('.aviso-entrada').textContent = mensagem;
        porId('entrar').disabled = true;
        mostrarAviso(mensagem, true);
        console.error('Railroad Mestre:', erro);
        return;
    }

    estado.navegacao = criarNavegacao({
        antesDeNavegar: (_pagina, anterior) => {
            if (anterior !== 'npcs') return true;
            if (!contexto.npcs.confirmarSaida()) return false;
            contexto.npcs.descartarEdicao();
            return true;
        },
        aoNavegar: (pagina) => {
            document.body.classList.toggle('fichas-ativas', pagina === 'fichas');
            if (pagina === 'fichas') void contexto.fichas.atualizarVisualizacao();
        },
    });
    contexto.fichas.iniciarEventos();
    contexto.npcs.iniciarEventos();
    estado.quadro = iniciarQuadroMestre({ aoAlterar: marcarRascunhoAlterado });
    let armazenamento;
    try {
        armazenamento = window.localStorage;
    } catch {
        armazenamento = {
            getItem: () => null,
            setItem: () => { throw new Error('O navegador bloqueou o armazenamento local.'); },
        };
    }
    estado.sessoesRepo = criarRepositorioSessoes(armazenamento);
    estado.npcsRepo = criarRepositorioNpcs(armazenamento);
    contexto.npcs.carregarCampanha();

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
    window.addEventListener('beforeunload', (evento) => {
        if (!estado.rascunhoSujo && !contexto.npcs.temAlteracoesPendentes()) return;
        evento.preventDefault();
        evento.returnValue = '';
    });
    porId('salvar-campanha').addEventListener('click', () =>
        void executar(porId('salvar-campanha'), async () => {
            contexto.npcs.salvarEdicaoPendente();
            await salvarCampanhaAtual();
        }));
    porId('usar-local').addEventListener('click', () =>
        void executar(porId('usar-local'), async () => {
            // Modo local não exige configuração do Supabase ou conexão com a internet.
            estado.repositorio = criarRepositorioCampanhasLocal(armazenamento);
            await quandoSessaoMudar({ id: 'mestre-local', email: 'Modo local' }, true);
            mostrarAviso('Modo local ativo. Campanhas, diários e NPCs ficam neste navegador.');
        }));
    porId('entrar').addEventListener('click', () =>
        void executar(porId('entrar'), async () => entrarComGoogle(await obterCliente())));
    porId('sair').addEventListener('click', () =>
        void executar(porId('sair'), async () => {
            if (estado.rascunhoSujo && !confirm(
                'O diário tem alterações não salvas neste navegador. Deseja sair e descartá-las?'
            )) return;
            if (!contexto.npcs.confirmarSaida()) return;
            if (estado.modoLocal) {
                estado.modoLocal = false;
                await quandoSessaoMudar(null);
                // Restaura o repositório online somente se já estiver configurado.
                if (estado.cliente) {
                    estado.repositorio = criarRepositorioCampanhas(estado.cliente);
                    const { data } = await estado.cliente.auth.getSession();
                    if (data?.session?.user) await quandoSessaoMudar(data.session.user);
                }
                return;
            }
            await sairDaConta(estado.cliente);
        }));

    try {
        estado.cliente = await obterCliente();
        estado.repositorio = criarRepositorioCampanhas(estado.cliente);
        await iniciarAutenticacao(estado.cliente, quandoSessaoMudar);
    } catch (erro) {
        // O modo local continua disponível mesmo sem Supabase configurado.
        mostrarAviso(`Google indisponível: ${erro.message}. Você ainda pode usar o modo local.`, true);
        console.error('Railroad Mestre:', erro);
    }
}

void iniciar();
