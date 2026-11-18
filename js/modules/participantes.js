/**
 * Agrupa os registros retornados pela RPC por jogador. Um jogador pode enviar
 * várias fichas, mas continua aparecendo uma única vez na lista da mesa.
 */
export function agruparParticipantes(registros = []) {
    const grupos = new Map();

    for (const registro of registros) {
        if (!registro?.jogador_id) continue;

        if (!grupos.has(registro.jogador_id)) {
            grupos.set(registro.jogador_id, {
                jogadorId: registro.jogador_id,
                jogadorNome: registro.jogador_nome || 'Jogador sem nome',
                conviteStatus: registro.convite_status,
                personagens: [],
            });
        }

        if (registro.envio_id) {
            grupos.get(registro.jogador_id).personagens.push({
                envioId: registro.envio_id,
                nome: registro.personagem_nome || 'Personagem sem nome',
                status: registro.ficha_status,
            });
        }
    }

    return [...grupos.values()];
}
