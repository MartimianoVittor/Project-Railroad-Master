// Combate e Viagem identificam a mesma ficha com o mesmo par origem/ID na campanha.
export function listarPersonagensDisponiveis(estado, nomesJogadores) {
    const personagens = (estado.npcs ?? []).map((npc) => ({
        id: `npc:${npc.id}`, ref: npc.id, tipo: 'npc', nome: npc.nome || 'NPC',
        responsavel: 'NPC', papel: npc.papel || npc.profissao || '',
    }));
    for (const envio of estado.envios ?? []) {
        const aprovado = [envio.status, envio.estado].some((valor) =>
            valor === 'aprovada' || valor === 'aprovado');
        const ref = envio.ficha_id || envio.id;
        if (!aprovado || !ref) continue;
        personagens.push({
            id: `jogador:${ref}`, ref, tipo: 'jogador',
            nome: envio.nome_personagem || envio.titulo || envio.nome || 'Personagem',
            responsavel: nomesJogadores.get(ref) || envio.nome_jogador || 'Nome não informado',
            papel: '',
        });
    }
    return personagens;
}
