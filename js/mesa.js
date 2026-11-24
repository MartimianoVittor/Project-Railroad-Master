import { criarRepositorioSessoes } from './services/sessoesLocal.js?v=mesa-31';
import { criarRepositorioNpcs } from './services/npcsLocal.js?v=mesa-31';
import { iniciarQuadroMestre } from './modules/quadroMestre.js?v=mesa-31';
import { criarNavegacao } from './modules/navegacao.js?v=mesa-31';
import { mostrarAviso, executar } from './core/feedback.js?v=mesa-31';
import { carregarInterface } from './core/carregarInterface.js?v=mesa-31';
import { porId } from './core/dom.js?v=mesa-31';
import { iniciarSessao } from './app/sessao.js?v=mesa-31';
import { estado } from './app/estado.js?v=mesa-31';
import { criarControladorDiario } from './controllers/diario.js?v=mesa-31';
import { criarControladorCampanhas } from './controllers/campanhas.js?v=mesa-31';
import { criarControladorFichas } from './controllers/fichas.js?v=mesa-31';
import { criarControladorNpcs } from './controllers/npcs.js?v=mesa-31';
import { criarControladorCombate } from './controllers/combate.js?v=mesa-31';
import { criarControladorViagem } from './controllers/viagem.js?v=mesa-31';
import { criarMenuConta } from './modules/contaMestre.js?v=mesa-31';
import { criarControladorUtilitarios } from './controllers/utilitarios.js?v=mesa-31';

// Controladores compartilham estado.
const contexto = { estado };
contexto.diario = criarControladorDiario(contexto);
contexto.fichas = criarControladorFichas(contexto);
contexto.npcs = criarControladorNpcs(contexto);
contexto.campanhas = criarControladorCampanhas(contexto);
contexto.combate = criarControladorCombate(contexto);
contexto.viagem = criarControladorViagem(contexto);
contexto.utilitarios = criarControladorUtilitarios(contexto);

async function salvarMesa() {
    await contexto.npcs.salvarEdicaoPendente();
    await contexto.diario.salvarCampanhaAtual();
}

const conta = criarMenuConta({ estado, salvarMesa });

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
            document.body.classList.toggle('combate-ativo', pagina === 'combate');
            if (pagina === 'fichas') void contexto.fichas.atualizarVisualizacao();
            if (pagina === 'combate') contexto.combate.atualizar();
            if (pagina === 'viagem') contexto.viagem.atualizar();
            if (pagina === 'utilitarios') contexto.utilitarios.atualizar();
        },
    });
    contexto.campanhas.iniciarEventos();
    contexto.diario.iniciarEventos();
    contexto.fichas.iniciarEventos();
    contexto.npcs.iniciarEventos();
    contexto.combate.iniciarEventos();
    contexto.viagem.iniciarEventos();
    contexto.utilitarios.iniciarEventos();
    estado.quadro = iniciarQuadroMestre({ aoAlterar: contexto.diario.marcarRascunhoAlterado });
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

    window.addEventListener('beforeunload', (evento) => {
        if (!estado.rascunhoSujo && !contexto.npcs.temAlteracoesPendentes()) return;
        evento.preventDefault();
        evento.returnValue = '';
    });
    conta.iniciarEventos();
    porId('salvar-campanha').addEventListener('click', (evento) =>
        void executar(evento.currentTarget, salvarMesa));
    iniciarSessao(contexto, conta, armazenamento);
}

void iniciar();
