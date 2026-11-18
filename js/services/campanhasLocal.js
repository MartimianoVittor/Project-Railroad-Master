/** Campanhas locais, isoladas das campanhas online e salvas somente neste navegador. */
const CHAVE = 'railroad_mestre_campanhas_locais:v1';
export function criarRepositorioCampanhasLocal(armazenamento) {
    function ler() {
        try {
            const dados = JSON.parse(armazenamento.getItem(CHAVE) || '[]');
            return Array.isArray(dados) ? dados.filter((item) => item && typeof item.campanha_id === 'string') : [];
        } catch { return []; }
    }
    function gravar(campanhas) {
        try { armazenamento.setItem(CHAVE, JSON.stringify(campanhas)); }
        catch { throw new Error('Não foi possível salvar campanhas locais. Verifique o armazenamento do navegador.'); }
    }
    const somenteOnline = () => { throw new Error('Convites e fichas compartilhadas exigem entrar com Google.'); };
    return {
        listarCampanhas: async () => ler(),
        criarCampanha: async (nome, descricao) => {
            const id = crypto.randomUUID();
            gravar([...ler(), { campanha_id: id, nome, descricao, criada_em: new Date().toISOString() }]);
            return id;
        },
        excluirCampanha: async (id) => {
            const lista = ler();
            if (!lista.some((item) => item.campanha_id === id)) throw new Error('Campanha local não encontrada.');
            gravar(lista.filter((item) => item.campanha_id !== id));
        },
        listarParticipantes: async () => [],
        listarEnvios: async () => [],
        convidarJogador: somenteOnline,
        decidirEnvio: somenteOnline,
        removerEnvio: somenteOnline,
        excluirJogador: somenteOnline,
        obterFicha: somenteOnline,
    };
}
