import { obterImagensStorage } from './imagensStorage.js?v=mesa-39';
import { exigir } from '../core/cliente.js?v=mesa-39';

/**
 * O Mestre acessa campanhas exclusivamente por RPCs autenticadas.
 * A leitura das fichas usa uma RPC com campos permitidos e RLS restritiva.
 * A autorização é sempre validada no banco; nunca confie apenas na interface.
 */
export function criarRepositorioCampanhas(cliente) {
    const chamar = async (nome, parametros) => exigir(await cliente.rpc(nome, parametros));

    return {
        listarCampanhas: () => chamar('listar_campanhas_detalhadas_mestre'),

        criarCampanha: (nome, descricao) => chamar('criar_campanha_descrita_mestre', {
            p_nome: nome,
            p_descricao: descricao,
        }),

        excluirCampanha: (campanhaId) => chamar('excluir_campanha_mestre', {
            p_campanha_id: campanhaId,
        }),

        listarParticipantes: (campanhaId) => chamar('listar_participantes_campanha_mestre', {
            p_campanha_id: campanhaId,
        }),

        convidarJogador: (campanhaId, jogadorId) => chamar('convidar_jogador_mesa', {
            p_campanha_id: campanhaId,
            p_jogador_id: jogadorId,
        }),

        listarEnvios: (campanhaId) => chamar('listar_fichas_campanha_mestre', {
            p_campanha_id: campanhaId,
        }),

        decidirEnvio: (envioId, aprovar) => chamar('decidir_ficha_campanha', {
            p_envio_id: envioId,
            p_aprovar: aprovar,
        }),

        removerEnvio: (envioId) => chamar('remover_ficha_campanha', {
            p_envio_id: envioId,
        }),

        excluirJogador: (campanhaId, jogadorId) => chamar('excluir_jogador_mesa_mestre', {
            p_campanha_id: campanhaId,
            p_jogador_id: jogadorId,
        }),

        // A RPC filtra os campos no banco e impede o acesso ao quadro de ideias.
        obterFicha: async (campanhaId, fichaId) => {
            const ficha = await chamar('obter_ficha_para_mestre', {
                p_campanha_id: campanhaId, p_ficha_id: fichaId,
            });
            return obterImagensStorage(cliente).resolverDocumento(ficha);
        },
    };
}
