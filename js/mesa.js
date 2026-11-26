import { criarRepositorioSessoes } from './services/sessoesLocal.js?v=mesa-44';
import { criarRepositorioNpcs } from './services/npcsLocal.js?v=mesa-44';
import { iniciarQuadroMestre } from './modules/quadroMestre.js?v=mesa-44';
import { criarNavegacao } from './modules/navegacao.js?v=mesa-44';
import { iniciarMobileMestre } from './modules/mobileMestre.js?v=mesa-44';
import { mostrarAviso, executar } from './core/feedback.js?v=mesa-44';
import { carregarInterface } from './core/carregarInterface.js?v=mesa-44';
import { porId } from './core/dom.js?v=mesa-44';
import { iniciarSessao } from './app/sessao.js?v=mesa-44';
import { estado } from './app/estado.js?v=mesa-44';
import { criarControladorDiario } from './controllers/diario.js?v=mesa-44';
import { criarControladorCampanhas } from './controllers/campanhas.js?v=mesa-44';
import { criarControladorFichas } from './controllers/fichas.js?v=mesa-44';
import { criarControladorNpcs } from './controllers/npcs.js?v=mesa-44';
import { criarControladorCombate } from './controllers/combate.js?v=mesa-44';
import { criarControladorViagem } from './controllers/viagem.js?v=mesa-44';
import { criarMenuConta } from './modules/contaMestre.js?v=mesa-44';
import { criarControladorUtilitarios } from './controllers/utilitarios.js?v=mesa-44';
import { atualizarCatalogoPersonagens } from './services/catalogoPersonagens.js?v=mesa-44';

// Controladores compartilham estado.
const contexto = { estado };
contexto.diario = criarControladorDiario(contexto);
contexto.fichas = criarControladorFichas(contexto);
contexto.npcs = criarControladorNpcs(contexto);
contexto.campanhas = criarControladorCampanhas(contexto);
contexto.combate = criarControladorCombate(contexto);
contexto.viagem = criarControladorViagem(contexto);
contexto.utilitarios = criarControladorUtilitarios(contexto);

contexto.conciliarParticipantesMesa = () => {
    contexto.combate.reconciliarParticipantes();
    contexto.viagem.reconciliarParticipantes();
};
contexto.removerParticipanteMesa = (tipo, ref) => {
    if (!tipo || !ref) return;
    estado.referenciasRemovidasMesa.add(`${tipo}:${ref}`);
    contexto.combate.removerReferencia(tipo, ref);
    contexto.viagem.removerReferencia(tipo, ref);
};
let verificacaoMesa = null;
let escopoVerificacao = '';
contexto.revalidarParticipantesMesa = async ({ recarregarNpcs = true } = {}) => {
    if (!estado.campanhaId || !estado.usuario) return;
    const campanhaId = estado.campanhaId;
    const versaoSessao = estado.versaoSessao;
    const escopo = `${estado.usuario.id}:${campanhaId}:${versaoSessao}`;
    if (verificacaoMesa && escopoVerificacao === escopo) return verificacaoMesa;
    const tarefa = (async () => {
        // Sincronizar cada fonte de forma independente; erro de rede não é lista vazia.
        const consultas = [];
        if (!estado.modoLocal) estado.catalogoJogadoresConfirmado = false;
        if (recarregarNpcs) consultas.push(contexto.npcs.carregarCampanha());
        if (!estado.modoLocal) consultas.push(atualizarCatalogoPersonagens({ estado, campanhas: contexto.campanhas }));
        const resultados = await Promise.allSettled(consultas);
        const falhas = resultados.filter(item => item.status === 'rejected');
        if (falhas.length && campanhaId === estado.campanhaId && versaoSessao === estado.versaoSessao) {
            console.warn('Fontes de participantes indisponíveis:', falhas.map(item => item.reason));
            mostrarAviso('Não foi possível atualizar todos os participantes. As referências não confirmadas foram preservadas.', true);
        }
        if (campanhaId === estado.campanhaId && versaoSessao === estado.versaoSessao)
            contexto.conciliarParticipantesMesa();
    })();
    verificacaoMesa = tarefa;
    escopoVerificacao = escopo;
    try { await tarefa; } finally { if (verificacaoMesa === tarefa) { verificacaoMesa = null; escopoVerificacao = ''; } }
};

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
            return contexto.npcs.confirmarSaida().then(permitido => {
                if (permitido) contexto.npcs.descartarEdicao();
                return permitido;
            });
        },
        aoNavegar: (pagina) => {
            document.body.classList.toggle('fichas-ativas', pagina === 'fichas');
            document.body.classList.toggle('combate-ativo', pagina === 'combate');
            if (pagina === 'fichas') void contexto.fichas.atualizarVisualizacao();
            if (pagina === 'combate') contexto.combate.atualizar();
            if (pagina === 'viagem') contexto.viagem.atualizar();
            if (pagina === 'combate' || pagina === 'viagem')
                void contexto.revalidarParticipantesMesa();
            if (pagina === 'utilitarios') contexto.utilitarios.atualizar();
        },
    });
    iniciarMobileMestre();
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
