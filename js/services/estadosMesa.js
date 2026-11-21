/**
 * Estados operacionais privados do Mestre (Combate e Viagens).
 * As migrações 007, 008 e 009 devem estar aplicadas no Supabase.
 * Não se escrevem fichas pertencentes aos jogadores.
 */
import { obterCliente, exigir } from '../core/cliente.js';

const TIPOS = new Set(['combate', 'viagens']);
function validar(tipo, campanhaId) {
    if (!TIPOS.has(tipo) || !campanhaId) throw new Error('Tipo ou campanha de estado inválido.');
}
export async function lerEstadoMesa(campanhaId, tipo) {
    validar(tipo, campanhaId);
    const db = await obterCliente();
    return exigir(await db.from('estados_mestre')
        .select('dados,revisao,updated_at')
        .eq('campanha_id', campanhaId).eq('tipo', tipo).maybeSingle());
}
export async function gravarEstadoMesa(campanhaId, tipo, dados, revisao) {
    validar(tipo, campanhaId);
    const db = await obterCliente();
    return exigir(await db.rpc('salvar_estado_mestre', {
        p_campanha_id: campanhaId, p_tipo: tipo,
        p_dados: dados, p_revisao: revisao,
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
    confirmar = (mensagem) => window.confirm(mensagem),
    armazenamento = () => window.localStorage,
}) {
    validar(tipo, 'modelo');
    let escopo = '', token = 0, revisao = 0, carregado = false;
    let emGravacao = false, pendente = null, alteracoes = 0, temporizador = null;
    let bloqueado = false;
    const podeUsarBanco = () => Boolean(!estado.modoLocal && estado.cliente && estado.usuario?.id && estado.campanhaId);
    const escopoAtual = () => podeUsarBanco() ? `${estado.usuario.id}:${estado.campanhaId}` : '';
    const chavePendente = (chave) => `railroad-mestre:sync-pendente:${tipo}:${chave}`;
    const chaveBackup = (chave) => `railroad-mestre:backup-pre-nuvem:${tipo}:${chave}`;
    function pendencia(chave, valor) {
        try {
            const storage = armazenamento();
            if (valor) storage.setItem(chavePendente(chave), '1');
            else storage.removeItem(chavePendente(chave));
        } catch { /* O armazenamento de origem do controlador ainda preserva os dados. */ }
    }
    const temPendencia = chave => {
        try { return armazenamento().getItem(chavePendente(chave)) === '1'; } catch { return false; }
    };
    function guardarBackup(chave, dados) {
        try {
            const storage = armazenamento();
            if (!storage.getItem(chaveBackup(chave)))
                storage.setItem(chaveBackup(chave), JSON.stringify(dados));
        } catch { /* Não impede a consulta; a cópia de origem ainda permanece disponível. */ }
    }
    function limparTemporizador() {
        if (temporizador !== null) { clearTimeout(temporizador); temporizador = null; }
    }
    function agendar() {
        if (!podeUsarBanco()) return;
        alteracoes++;
        const chave = escopoAtual();
        if (chave !== escopo) return; // a tela pode estar trocando de campanha
        pendencia(chave, true);
        if (!carregado || bloqueado) return;
        pendente = JSON.stringify(obterDados());
        limparTemporizador();
        temporizador = setTimeout(() => { temporizador = null; void enviar(); }, 600);
    }
    async function enviar() {
        if (emGravacao || !carregado || bloqueado || !pendente || escopoAtual() !== escopo) return;
        const chave = escopo, seq = token;
        emGravacao = true;
        try {
            while (pendente && token === seq && escopoAtual() === chave) {
                const conteudo = JSON.parse(pendente);
                pendente = null;
                const resposta = await gravar(estado.campanhaId, tipo, conteudo, revisao);
                if (token !== seq || escopoAtual() !== chave) return;
                revisao = Number(resposta?.revisao ?? resposta?.[0]?.revisao ?? revisao + 1);
            }
            if (token === seq && !pendente && escopoAtual() === chave) pendencia(chave, false);
        } catch (erro) {
            if (token === seq && escopoAtual() === chave) {
                // Retém o backup local; não substitui automaticamente o estado remoto.
                bloqueado = true;
                pendencia(chave, true);
                avisar(`Não foi possível sincronizar ${tipo} com o Supabase: ${erro.message}. A cópia deste navegador foi preservada. Reabra a página para escolher como resolver.`);
            }
        } finally {
            emGravacao = false;
        }
    }
    async function ativar() {
        const chave = escopoAtual();
        if (chave === escopo) return;
        escopo = chave;token++;limparTemporizador();revisao = 0;
        carregado = false;bloqueado = false;pendente = null;alteracoes = 0;
        if (!chave) return;
        const meuToken = token, inicio = alteracoes;
        const campanhaId = estado.campanhaId;
        const local = obterDados();
        try {
            const remoto = await ler(campanhaId, tipo);
            if (token !== meuToken || escopoAtual() !== chave) return;
            revisao = Number(remoto?.revisao ?? 0);
            const houveEdicoes = alteracoes !== inicio;
            const localPendente = houveEdicoes || temPendencia(chave);
            if (remoto && localPendente) {
                const enviarLocal = confirmar(`Há modificações locais de ${tipo} não sincronizadas. Deseja enviar a cópia deste navegador ao Supabase? Cancelar mantém a versão remota.`);
                if (enviarLocal) {
                    carregado = true;pendente = JSON.stringify(obterDados());
                    void enviar();return;
                }
            }
            if (remoto) {
                if (temConteudo(local) && JSON.stringify(local) !== JSON.stringify(remoto.dados)) guardarBackup(chave, local);
                aplicarDados(remoto.dados);
                preservarLocal();
                pendencia(chave, false);
                carregado = true;
                return;
            }
            carregado = true;
            if (temConteudo(obterDados())) {
                // Importação aditiva: não existe registro remoto para substituir.
                pendente = JSON.stringify(obterDados());
                void enviar();
            }
        } catch (erro) {
            if (token !== meuToken || escopoAtual() !== chave) return;
            bloqueado = true;
            avisar(`Não foi possível carregar ${tipo} do Supabase: ${erro.message}. Continuando com a cópia local; os dados locais não foram apagados.`);
        }
    }
    return { ativar, agendar };
}
