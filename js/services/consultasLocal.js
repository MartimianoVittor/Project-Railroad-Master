import { CONSULTAS_PADRAO } from '../modules/catalogoRegras.js?v=mesa-32';
import { copiarCartoes, nomeSeguro, paraCartoes } from '../modules/utilitarios/consultas.js?v=mesa-32';

export function chaveConsultas({ modoLocal, usuario, campanhaId }) {
    const modo = modoLocal ? 'local' : 'online';
    return `railroad-mestre-utilitarios-v1:${modo}:${usuario?.id || 'anonimo'}:${campanhaId || 'sem-campanha'}`;
}

export function carregarConsultas(armazenamento, chave) {
    const padrao = CONSULTAS_PADRAO[0];
    const consultas = {
        salvas: [],
        atual: { id: `p:${padrao.id}`, nome: padrao.nome, cartoes: paraCartoes(padrao.itens) },
    };
    if (!armazenamento) return consultas;
    try {
        const dados = JSON.parse(armazenamento.getItem(chave));
        if (dados?.versao !== 1) return consultas;
        if (Array.isArray(dados.salvas)) {
            consultas.salvas = dados.salvas.slice(0, 60)
                .filter((consulta) => typeof consulta?.id === 'string' && consulta.id.startsWith('u:'))
                .map((consulta) => ({
                    id: consulta.id, nome: nomeSeguro(consulta.nome) || 'Consulta sem título',
                    cartoes: copiarCartoes(consulta.cartoes),
                }));
        }
        if (Array.isArray(dados.atual?.cartoes)) {
            consultas.atual = {
                id: String(dados.atual.id || 'rascunho'), nome: nomeSeguro(dados.atual.nome),
                cartoes: copiarCartoes(dados.atual.cartoes),
            };
        }
    } catch { /* Um rascunho ilegível abre a consulta padrão. */ }
    return consultas;
}

export function gravarConsultas(armazenamento, chave, salvas, atual) {
    if (!armazenamento) throw new Error('Armazenamento local indisponível.');
    const copiar = (consulta) => ({ ...consulta, cartoes: copiarCartoes(consulta.cartoes) });
    armazenamento.setItem(chave, JSON.stringify({
        versao: 1, salvas: salvas.map(copiar), atual: copiar(atual),
    }));
}
