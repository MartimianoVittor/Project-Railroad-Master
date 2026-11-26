import { confirmar } from '../core/dialogos.js?v=mesa-44';
import { comProcessamento } from '../core/processamento.js?v=mesa-44';
import { entrarComGoogle, iniciarAutenticacao, obterCliente, sairDaConta } from '../core/cliente.js?v=mesa-44';
import { porId } from '../core/dom.js?v=mesa-44';
import { executar, mostrarAviso } from '../core/feedback.js?v=mesa-44';
import { criarRepositorioCampanhas } from '../services/campanhas.js?v=mesa-44';
import { criarRepositorioCampanhasLocal } from '../services/campanhasLocal.js?v=mesa-44';

export function iniciarSessao(contexto, conta, armazenamento, conectarCliente = obterCliente) {
    const { estado } = contexto;
    const repositorioLocal = criarRepositorioCampanhasLocal(armazenamento);
    let repositorioOnline = null;

    async function quandoSessaoMudar(usuario, local = false) {
        if (estado.modoLocal && !local) return;
        if (usuario?.id === estado.usuario?.id && local === estado.modoLocal) return;
        estado.modoLocal = local;
        estado.repositorio = local ? repositorioLocal : repositorioOnline;
        document.body.classList.toggle('modo-local', local);

        estado.versaoSessao++;
        estado.versaoLista++;
        estado.versaoCampanha++;
        estado.usuario = usuario;
        // Login com rolagem livre; abas com layout próprio.
        document.documentElement.classList.toggle('modo-entrada', !usuario);
        document.body.classList.toggle('modo-entrada', !usuario);
        if (!usuario) document.body.classList.remove('fichas-ativas', 'combate-ativo');
        estado.campanhas = [];
        estado.campanhaId = null;
        estado.participantes = [];
        estado.envios = [];
        estado.personagensAprovados = [];
        estado.catalogoJogadoresConfirmado = false;
        estado.catalogoDiretoConfirmado = false;
        estado.referenciasRemovidasMesa = new Set();
        estado.npcs = [];
        estado.npcsSincronizados = false;
        estado.rascunhoSujo = false;
        estado.salvoEm = null;
        estado.sessoes = [];
        estado.sessaoId = null;
        contexto.utilitarios.atualizarContexto();
        porId('nome-campanha').value = '';
        porId('descricao-campanha').value = '';
        porId('codigo-jogador').value = '';
        void contexto.diario.carregarRascunho();
        contexto.campanhas.listarCampanhas();
        contexto.campanhas.listarParticipantes();
        contexto.fichas.listarEnvios();
        void contexto.npcs.carregarCampanha();
        contexto.campanhas.mostrarCampanha();
        contexto.campanhas.mostrarFormularioConvite(false);

        porId('tela-entrada').hidden = Boolean(usuario);
        porId('painel').hidden = !usuario;
        porId('navegacao-mestre').hidden = !usuario;
        porId('navegacao-mobile-mestre').hidden = !usuario;
        conta.atualizarSessao(usuario);
        porId('identidade-sessao').hidden = !usuario;
        porId('usuario-email').hidden = !usuario;
        porId('usuario-email').textContent = local ? 'Modo local' : (usuario?.email ?? '');

        if (usuario) {
            estado.navegacao.abrir('campanhas');
            try { await contexto.campanhas.atualizarCampanhas(); }
            catch (erro) { mostrarAviso(`Não foi possível carregar suas campanhas: ${erro.message}`, true); }
        }
    }

    porId('usar-local').addEventListener('click', () =>
        void executar(porId('usar-local'), async () => {
            // Modo local não exige configuração do Supabase ou conexão com a internet.
            await quandoSessaoMudar({ id: 'mestre-local', email: 'Modo local' }, true);
            mostrarAviso('Modo local ativo. Campanhas, diários e NPCs ficam neste navegador.');
        }));
    porId('entrar').addEventListener('click', () =>
        void executar(porId('entrar'), async () => entrarComGoogle(await conectarCliente())));
    porId('sair').addEventListener('click', () =>
        void executar(porId('sair'), async () => {
            if (estado.rascunhoSujo && !await confirmar(
                'O diário tem alterações não salvas neste navegador. Deseja sair e descartá-las?'
            )) return;
            if (!contexto.npcs.confirmarSaida()) return;
            if (estado.modoLocal) {
                estado.modoLocal = false;
                await quandoSessaoMudar(null);
                // Uma sessão do Google pode ter sido restaurada enquanto a mesa estava em modo local.
                if (estado.cliente) {
                    const { data } = await estado.cliente.auth.getSession();
                    if (data?.session?.user) await quandoSessaoMudar(data.session.user);
                }
                return;
            }
            await sairDaConta(estado.cliente);
            // Mesmo sem evento SIGNED_OUT (sessão expirada), limpar a mesa localmente.
            await quandoSessaoMudar(null);
        }));

    async function conectar() {
        try {
            estado.cliente = await conectarCliente();
            repositorioOnline = criarRepositorioCampanhas(estado.cliente);
            await comProcessamento('Conectando à conta…', () => iniciarAutenticacao(estado.cliente, quandoSessaoMudar));
        } catch (erro) {
            // O modo local continua disponível mesmo sem Supabase configurado.
            if (estado.modoLocal) return;
            mostrarAviso(`Google indisponível: ${erro.message}. Você ainda pode usar o modo local.`, true);
            console.error('Railroad Mestre:', erro);
        }
    }

    void conectar();
}
