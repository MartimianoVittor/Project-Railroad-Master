import { confirmar } from '../core/dialogos.js?v=mesa-39';
import { obterImagensStorage, normalizarReferencias } from './imagensStorage.js?v=mesa-39';
/**
 * Estados operacionais privados do Mestre (Combate e Viagens).
 * As migrações 007, 008 e 009 devem estar aplicadas no Supabase.
 * Não se escrevem fichas pertencentes aos jogadores.
 */
import { obterCliente, exigir } from '../core/cliente.js?v=mesa-39';

const TIPOS = new Set(['combate', 'viagens']);
function validar(tipo, campanhaId) {
    if (!TIPOS.has(tipo) || !campanhaId) throw new Error('Tipo ou campanha de estado inválido.');
}
export async function lerEstadoMesa(campanhaId, tipo) {
    validar(tipo, campanhaId);
    const db = await obterCliente();
    const registro = exigir(await db.from('estados_mestre')
        .select('dados,revisao,updated_at')
        .eq('campanha_id', campanhaId).eq('tipo', tipo).maybeSingle());
    if (!registro) return null;
    return { ...registro, dados: await obterImagensStorage(db).resolverDocumento(registro.dados) };
}
export async function gravarEstadoMesa(campanhaId, tipo, dados, revisao) {
    validar(tipo, campanhaId);
    const db = await obterCliente();
    return exigir(await db.rpc('salvar_estado_mestre', {
        p_campanha_id: campanhaId, p_tipo: tipo,
        p_dados: await obterImagensStorage(db).prepararDocumento(dados,
            `campanhas/${campanhaId}/estados/${tipo}`), p_revisao: revisao,
    }));
}

/**
 * localStorage/sessionStorage continuam servindo como backup.
 * A gravação remota usa revisão otimista para não apagar alterações de outra aba.
 * Em falha ou conflito, dados locais permanecem intactos e não são sobrescritos.
 */
export function criarSincronizadorEstadoMesa({
    estado, tipo, obterDados, aplicarDados, temConteudo, preservarLocal,
    ler = lerEstadoMesa, gravar = gravarEstadoMesa,
    avisar = (mensagem) => console.warn(mensagem),
    confirmar: confirmarResposta = confirmar,
    armazenamento = () => window.localStorage,
    aoBloqueio = () => {},
}) {
    validar(tipo, 'modelo');
    let ativo = null;
    const indicarBloqueio = (fila) => {
        if (aindaAtivo(fila)) aoBloqueio(Boolean(fila.bloqueada));
    };

    function chaveAtual() {
        if (estado.modoLocal || !estado.cliente || !estado.usuario?.id || !estado.campanhaId) return null;
        return `${estado.usuario.id}:${estado.campanhaId}`;
    }

    function aindaAtivo(fila) {
        return fila === ativo && fila.chave === chaveAtual();
    }

    function chavePendente(fila) {
        return `railroad-mestre:sync-pendente:${tipo}:${fila.chave}`;
    }

    function marcarPendencia(fila, valor) {
        try {
            const local = armazenamento();
            if (valor) local.setItem(chavePendente(fila), '1');
            else local.removeItem(chavePendente(fila));
        } catch { /* A cópia principal continua sob responsabilidade do controlador. */ }
    }

    function temPendencia(fila) {
        try { return armazenamento().getItem(chavePendente(fila)) === '1'; }
        catch { return false; }
    }

    function guardarBackup(fila, dados) {
        const chave = `railroad-mestre:backup-pre-nuvem:${tipo}:${fila.chave}`;
        try {
            const local = armazenamento();
            if (!local.getItem(chave)) local.setItem(chave, JSON.stringify(normalizarReferencias(dados)));
        } catch { /* A ausência de espaço para outra cópia não impede a leitura do servidor. */ }
    }

    async function enviar(fila) {
        if (fila.enviando || fila.bloqueada || !fila.carregada || !aindaAtivo(fila)) return false;
        fila.enviando = true;
        try {
            while (fila.pendente && aindaAtivo(fila)) {
                const conteudoEnviado = fila.pendente;
                const dados = JSON.parse(conteudoEnviado);
                const resposta = await gravar(fila.campanhaId, tipo, dados, fila.revisao);
                if (!aindaAtivo(fila)) return false;
                fila.revisao = Number(resposta?.revisao ?? resposta?.[0]?.revisao ?? fila.revisao + 1);
                // Alterações realizadas durante o envio não devem ser descartadas.
                if (fila.pendente === conteudoEnviado) fila.pendente = null;
            }
            if (aindaAtivo(fila)) {
                marcarPendencia(fila, false);
                indicarBloqueio(fila);
            }
            return true;
        } catch (erro) {
            if (!aindaAtivo(fila)) return;
            fila.bloqueada = true;
            marcarPendencia(fila, true);
            indicarBloqueio(fila);
            avisar(`Não foi possível sincronizar ${tipo} com o Supabase: ${erro.message}. A cópia local está preservada. Use "Tentar sincronizar" para verificar a revisão remota antes de reenviar.`);
            return false;
        } finally {
            fila.enviando = false;
        }
    }

    function agendar() {
        const fila = ativo;
        if (!fila || !aindaAtivo(fila)) return;
        fila.editada = true;
        marcarPendencia(fila, true);
        // Sempre capture a versão mais recente, mesmo durante um bloqueio.
        fila.pendente = JSON.stringify(normalizarReferencias(obterDados()));
        if (!fila.carregada || fila.bloqueada) return;
        clearTimeout(fila.temporizador);
        fila.temporizador = setTimeout(() => void enviar(fila), 600);
    }

    async function ativar(forcar = false) {
        const chave = chaveAtual();
        if (!forcar && chave === (ativo?.chave ?? null)) return;
        if (ativo) clearTimeout(ativo.temporizador);
        ativo = null;
        if (!chave) { aoBloqueio(false); return; }

        // Cada campanha mantém sua própria revisão e gravação em andamento.
        const fila = {
            chave, campanhaId: estado.campanhaId, revisao: 0, carregada: false,
            editada: false, bloqueada: false, enviando: false, pendente: null, temporizador: null,
        };
        ativo = fila;
        indicarBloqueio(fila);
        try {
            const remoto = await ler(fila.campanhaId, tipo);
            if (!aindaAtivo(fila)) return;
            fila.revisao = Number(remoto?.revisao ?? 0);
            const local = obterDados();
            const haPendencia = fila.editada || temPendencia(fila);
            const enviarLocal = remoto && haPendencia && await confirmarResposta(
                `Há modificações locais de ${tipo} não sincronizadas. Deseja enviar a cópia deste navegador ao Supabase? Cancelar mantém a versão remota.`
            );
            if (!aindaAtivo(fila)) return; // A confirmação pode ser respondida após mudar de campanha.
            if (remoto && !enviarLocal) {
                if (temConteudo(local) && JSON.stringify(local) !== JSON.stringify(remoto.dados)) {
                    guardarBackup(fila, local);
                }
                aplicarDados(remoto.dados);
                preservarLocal();
                marcarPendencia(fila, false);
                fila.carregada = true;
                return;
            }
            fila.carregada = true;
            if (enviarLocal || temConteudo(local)) {
                fila.pendente = JSON.stringify(local);
                marcarPendencia(fila, true);
                void enviar(fila);
            } else {
                marcarPendencia(fila, false);
            }
        } catch (erro) {
            if (!aindaAtivo(fila)) return;
            fila.bloqueada = true;
            if (fila.editada || temConteudo(obterDados())) marcarPendencia(fila, true);
            indicarBloqueio(fila);
            avisar(`Não foi possível carregar ${tipo} do Supabase: ${erro.message}. A cópia local foi preservada. Use "Tentar sincronizar" quando a conexão voltar.`);
        }
    }

    /** Retenta após conferir a revisão remota, sem sobrescrever edições concorrentes. */
    async function tentarNovamente() {
        const fila = ativo;
        if (!fila || !aindaAtivo(fila)) return false;
        if (!fila.carregada) {
            // A leitura inicial falhou: refazer a leitura e oferecer a escolha usual.
            await ativar(true);
            return Boolean(ativo?.carregada && !ativo?.bloqueada);
        }
        if (fila.enviando) return false;
        if (!fila.bloqueada && !temPendencia(fila)) return true;
        try {
            const remoto = await ler(fila.campanhaId, tipo);
            if (!aindaAtivo(fila)) return false;
            const revisaoRemota = Number(remoto?.revisao ?? 0);
            if (revisaoRemota !== fila.revisao) {
                fila.bloqueada = true;
                marcarPendencia(fila, true);
                indicarBloqueio(fila);
                avisar(`Conflito: ${tipo} foi alterado em outro dispositivo. O backup local foi preservado; recarregue a página para comparar as versões.`);
                return false;
            }
            // Atualiza a pendência com os dados em memória mais recentes.
            fila.pendente = JSON.stringify(normalizarReferencias(obterDados()));
            fila.bloqueada = false;
            indicarBloqueio(fila);
            return await enviar(fila);
        } catch (erro) {
            if (!aindaAtivo(fila)) return false;
            fila.bloqueada = true;
            marcarPendencia(fila, true);
            indicarBloqueio(fila);
            avisar(`Não foi possível verificar a revisão de ${tipo}: ${erro.message}. O backup foi preservado.`);
            return false;
        }
    }

    return { ativar, agendar, tentarNovamente };
}
