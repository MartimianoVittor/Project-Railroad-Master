// Combate e Viagem compartilham a mesma identificação da ficha na campanha.
// Os participantes são a fonte da aprovação; os envios fornecem o ID da ficha.
export function listarPersonagensDisponiveis(estado, nomesJogadores = new Map()) {
    const personagens = (estado.npcs ?? []).map(npc => ({
        id: `npc:${npc.id}`, ref: npc.id, tipo: 'npc',
        nome: npc.nome || 'NPC', responsavel: 'NPC',
        papel: npc.papel || npc.profissao || '',
    }));

    const aprovado = valor => ['aprovada', 'aprovado'].includes(String(valor ?? '').toLowerCase());
    const enviosPorId = new Map((estado.envios ?? [])
        .filter(envio => envio?.envio_id)
        .map(envio => [envio.envio_id, envio]));
    const adicionados = new Set();

    const incluir = (ref, nome, responsavel) => {
        if (!ref || adicionados.has(ref)) return;
        adicionados.add(ref);
        personagens.push({
            id: `jogador:${ref}`, ref, tipo: 'jogador',
            nome: nome || 'Personagem',
            responsavel: nomesJogadores.get(ref) || responsavel || 'Nome não informado',
            papel: '',
        });
    };

    // Migração 020: rota direta evita depender da junção de duas RPCs antigas.
    for (const ficha of estado.personagensAprovados ?? []) {
        incluir(ficha.ficha_id, ficha.personagem_nome || ficha.titulo, ficha.jogador_nome);
    }

    // A RPC de participantes retorna envio_id, NÃO ficha_id.
    // Uma ficha aprovada aparece na lista mesmo quando a RPC de envios
    // não inclui todos os metadados do personagem.
    for (const participante of estado.participantes ?? []) {
        if (!aprovado(participante.ficha_status)) continue;
        if (participante.convite_status && participante.convite_status !== 'aceito') continue;
        const envio = enviosPorId.get(participante.envio_id);
        const ref = participante.ficha_id || envio?.ficha_id;
        incluir(ref, participante.personagem_nome || envio?.nome_personagem || envio?.titulo,
            participante.jogador_nome || envio?.nome_jogador);
    }

    for (const envio of estado.envios ?? []) {
        if (!aprovado(envio.status ?? envio.estado)) continue;
        incluir(envio.ficha_id, envio.nome_personagem || envio.titulo || envio.nome,
            envio.nome_jogador);
    }

    return personagens;
}
