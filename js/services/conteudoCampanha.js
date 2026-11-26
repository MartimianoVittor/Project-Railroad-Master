import { obterImagensStorage } from './imagensStorage.js?v=mesa-44';
/** Persistência remota de sessões e NPCs, com transações e controle de revisão.
 * Requer a migração supabase/012_integridade_conteudo_mestre.sql.
 */
import { obterCliente, exigir } from '../core/cliente.js?v=mesa-44';
import { normalizarNpc } from '../modules/npcs.js?v=mesa-44';

function revisaoRecebida(resultado) {
    const linha = Array.isArray(resultado) ? resultado[0] : resultado;
    const revisao = Number(linha?.revisao);
    if (!Number.isSafeInteger(revisao) || revisao < 1) {
        throw new Error('O Supabase não confirmou a revisão da gravação. Atualize os dados antes de continuar.');
    }
    return revisao;
}

function dadosNpc(npc) {
    const { revisao: _revisao, ...dados } = npc;
    return dados;
}

export async function listarNpcsRemotos(campanhaId, conectar = obterCliente) {
    const db = await conectar();
    const linhas = exigir(await db.from('npcs')
        .select('id,nome,dados,revisao')
        .eq('campanha_id', campanhaId)
        .order('created_at'));
    const imagens = obterImagensStorage(db);
    return Promise.all(linhas.map(async ({ dados, id, nome, revisao }) => normalizarNpc({
        ...await imagens.resolverDocumento(dados), id, nome, revisao,
    })));
}

/** Revisão zero cria um NPC; revisões positivas só atualizam a versão esperada. */
export async function gravarNpcRemoto(campanhaId, npc, conectar = obterCliente) {
    const db = await conectar();
    const resposta = exigir(await db.rpc('salvar_npc_mestre', {
        p_campanha_id: campanhaId,
        p_npc_id: npc.id,
        p_nome: npc.nome,
        p_dados: await obterImagensStorage(db).prepararDocumento(dadosNpc(npc),
            `campanhas/${campanhaId}/npcs/${npc.id}`),
        p_revisao: npc.revisao ?? 0,
    }));
    return revisaoRecebida(resposta);
}

/** Não exclui NPC modificado por outro dispositivo após a leitura. */
export async function apagarNpcRemoto(campanhaId, id, revisao, conectar = obterCliente) {
    if (!Number.isSafeInteger(revisao) || revisao < 1) {
        throw new Error('Atualize os NPCs antes de excluir uma ficha sem revisão remota.');
    }
    const db = await conectar();
    const excluido = exigir(await db.rpc('excluir_npc_mestre', {
        p_campanha_id: campanhaId,
        p_npc_id: id,
        p_revisao: revisao,
    }));
    if (excluido !== true) {
        throw new Error('O Supabase não confirmou a exclusão do NPC.');
    }
}

/** Atualiza todos os NPCs combatentes em uma transação; nenhum é gravado parcialmente. */
export async function gravarNpcsCombateRemoto(campanhaId, npcs, conectar = obterCliente) {
    if (!npcs.length) return [];
    const db = await conectar();
    const imagens = obterImagensStorage(db);
    const preparados = await Promise.all(npcs.map(async (npc) => ({
        id: npc.id, nome: npc.nome,
        dados: await imagens.prepararDocumento(dadosNpc(npc), `campanhas/${campanhaId}/npcs/${npc.id}`),
        revisao: npc.revisao ?? 0,
    })));
    const resultados = exigir(await db.rpc('salvar_npcs_combate_mestre', {
        p_campanha_id: campanhaId,
        p_npcs: preparados,
    }));
    if (!Array.isArray(resultados) || resultados.length !== npcs.length) {
        throw new Error('O Supabase não confirmou a gravação de todos os NPCs.');
    }
    return resultados.map(({ id, revisao }) => ({ id, revisao: revisaoRecebida({ revisao }) }));
}

/** Leitura consistente do diário: sessões e revisão provêm da mesma consulta SQL. */
export async function listarSessoesRemotas(campanhaId, conectar = obterCliente) {
    const db = await conectar();
    const dados = exigir(await db.rpc('ler_diario_mestre', {
        p_campanha_id: campanhaId,
    }).single());
    const imagens = obterImagensStorage(db);
    const sessoes = Array.isArray(dados.sessoes)
        ? await Promise.all(dados.sessoes.map((sessao) => imagens.resolverDocumento(sessao))) : [];
    return {
        sessoes,
        ativaId: dados.ativa_id ?? sessoes[0]?.id ?? null,
        salvoEm: dados.salvo_em ?? null,
        revisao: Number(dados.revisao ?? 0),
    };
}

/** Uma única operação SQL grava o diário ou rejeita tudo em caso de falha. */
export async function salvarSessoesRemotas(campanhaId, diario, idsConhecidos, revisao = 0, conectar = obterCliente) {
    const db = await conectar();
    const imagens = obterImagensStorage(db);
    const sessoes = await Promise.all(diario.sessoes.map((sessao) => imagens.prepararDocumento(
        sessao, `campanhas/${campanhaId}/sessoes/${sessao.id}`)));
    const resposta = exigir(await db.rpc('salvar_diario_mestre', {
        p_campanha_id: campanhaId,
        p_sessoes: sessoes,
        p_ativa_id: diario.ativaId,
        p_ids_conhecidos: [...idsConhecidos],
        p_revisao: revisao,
    }));
    const novaRevisao = revisaoRecebida(resposta);
    // Não atrasa o salvamento: a coleta é conservadora (30 dias) e autorizada
    // novamente no PostgreSQL. Erros de limpeza não desfazem o Diário salvo.
    void imagens.limparImagensObsoletasDasSessoes(campanhaId)
        .catch((erro) => console.warn('Limpeza de imagens adiada:', erro.message));
    return novaRevisao;
}
