// Caminho público das versões anteriores para quem importa o módulo diretamente.
export {
    criarSessao, duplicarSessao, moverSessao, LIMITE_DESCRICAO_SESSAO, LIMITE_NOME_SESSAO,
} from './diario/sessoes.js?v=mesa-34';
export { criarRepositorioSessoes } from '../services/sessoesLocal.js?v=mesa-34';
