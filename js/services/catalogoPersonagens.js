/** Sincroniza as fichas aprovadas no momento de abrir Combate ou Viagem.
 * A migração 020 fornece IDs diretos; sem ela, as duas RPCs legadas continuam
 * sendo utilizadas. Falhas simultâneas são informadas, nunca silenciadas. */
export async function atualizarCatalogoPersonagens({ estado, campanhas }) {
    const campanhaId = estado.campanhaId;
    if (!campanhaId || estado.modoLocal) return;
    const versaoSessao = estado.versaoSessao;
    const carregarLegado = campanhas?.atualizarConteudoCampanha
        ? campanhas.atualizarConteudoCampanha()
        : Promise.reject(new Error('Atualização da campanha indisponível.'));
    const carregarDireto = estado.repositorio?.listarPersonagensAprovados
        ? estado.repositorio.listarPersonagensAprovados(campanhaId)
        : Promise.reject(new Error('Catálogo dedicado indisponível.'));
    const [legado, direto] = await Promise.allSettled([carregarLegado, carregarDireto]);
    if (estado.campanhaId !== campanhaId || estado.versaoSessao !== versaoSessao) return;
    if (direto.status === 'fulfilled')
        estado.personagensAprovados = Array.isArray(direto.value) ? direto.value : [];
    if (legado.status === 'rejected' && direto.status === 'rejected') {
        throw new Error(`Não foi possível carregar os personagens: ${legado.reason?.message || direto.reason?.message || 'erro de conexão'}`);
    }
    // Uma RPC ausente em versões anteriores do BD é tolerada, pois a consulta
    // antiga continua disponível. Não inserir personagens sem aprovação.
}
