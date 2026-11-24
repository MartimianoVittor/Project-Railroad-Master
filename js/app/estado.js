/** Estado em memória compartilhado pelos controladores. */
export const UUID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export const ESTADOS_CONVITE = { pendente: 'Aguardando jogador', aceito: 'Convite aceito', recusado: 'Convite recusado' };
export const ESTADOS_FICHA = { pendente: 'Aguardando aprovação', aprovada: 'Aprovada', recusada: 'Recusada' };

export const estado = {
    cliente: null, repositorio: null, usuario: null, modoLocal: false,
    campanhas: [], campanhaId: null, participantes: [], envios: [],
    versaoSessao: 0, versaoCampanha: 0, versaoFicha: 0, versaoLista: 0,
    navegacao: null, sessoesRepo: null, quadro: null, sessoes: [], sessaoId: null,
    rascunhoSujo: false, salvoEm: null, sessaoEmEdicaoId: null,
    npcsRepo: null, npcs: [], npcsSincronizados: false,
};

