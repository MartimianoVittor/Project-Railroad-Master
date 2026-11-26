import { listarPersonagensDisponiveis } from './personagensCampanha.js?v=mesa-44';

function referencia(registro) {
    return registro?.ref ?? String(registro?.id || '').replace(/^(npc|jogador):/, '');
}

/**
 * Retorna apenas fontes que podem confirmar ausência de participantes.
 * A consulta antiga pode listar aprovados, mas não é completa para exclusões.
 */
export function catalogosConfirmadosMesa(estado) {
    return {
        removidos: estado.referenciasRemovidasMesa ?? null,
        npcs: estado.modoLocal || estado.npcsSincronizados
            ? new Set((estado.npcs ?? []).map(npc => npc.id)) : null,
        jogadores: estado.catalogoJogadoresConfirmado
            ? new Set(listarPersonagensDisponiveis(estado)
                .filter(item => item.tipo === 'jogador').map(item => item.ref)) : null,
    };
}

/**
 * Remove vínculos da mesa usando referências estáveis (tipo + ID da ficha).
 * null significa catálogo indisponível: não remover participantes desse tipo.
 */
export function filtrarParticipantesDesvinculados(registros, { npcs = null, jogadores = null, removidos: tombstones = null } = {}) {
    if (!Array.isArray(registros)) return { itens: [], removidos: [] };
    const removidos = [];
    const itens = registros.filter((registro) => {
        if (tombstones?.has(`${registro?.tipo}:${referencia(registro)}`)) {
            removidos.push(registro);
            return false;
        }
        const permitidos = registro?.tipo === 'npc' ? npcs
            : registro?.tipo === 'jogador' ? jogadores : null;
        if (permitidos === null || permitidos === undefined) return true;
        if (permitidos.has(referencia(registro))) return true;
        removidos.push(registro);
        return false;
    });
    return { itens, removidos };
}

/** Remoção explícita, após o banco confirmar a exclusão da campanha. */
export function filtrarReferenciaRemovida(registros, tipo, ref) {
    if (!tipo || !ref) return { itens: registros, removidos: [] };
    const candidatos = Array.isArray(registros) ? registros : [];
    const removidos = [];
    const itens = candidatos.filter((registro) => {
        if (registro.tipo !== tipo || referencia(registro) !== ref) return true;
        removidos.push(registro);
        return false;
    });
    return { itens, removidos };
}
