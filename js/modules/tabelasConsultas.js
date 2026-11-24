/** Representação tabular de valores já presentes no catálogo do Livro de Regras 1.0.
 * Não calcula nem altera resultados: reorganiza somente as referências existentes.
 * Entradas narrativas permanecem como notas, sem inferir colunas ausentes.
 */
export function dadosTabela(regra) {
    const itens = Array.isArray(regra?.itens) ? regra.itens : [];
    if (!itens.length) return { cabecalhos: [], linhas: [], notas: [] };

    const especiais = {
        'armas-perfis': { cabecalhos:['Arma','Corpo a corpo','Curta','Média','Longa','Extrema'], partes:5 },
        'viagem-distancias': { cabecalhos:['Transporte','Cauteloso (km/dia)','Normal (km/dia)','Acelerado (km/dia)'], partes:3 },
        'catalogo-transportes': { cabecalhos:['Transporte','Preço','Carga','Pessoas','Km até cuidados'], partes:4 },
    };
    const modelo = especiais[regra.id];
    const linhas = [];
    const notas = [];
    if (modelo) {
        for (const item of itens) {
            const indice = item.indexOf(':');
            if (indice < 1) { notas.push(item); continue; }
            const partes = item.slice(indice + 1).trim().split(/\s*\/\s*/);
            if (partes.length !== modelo.partes) { notas.push(item); continue; }
            linhas.push([item.slice(0,indice).trim(), ...partes]);
        }
        return { cabecalhos:modelo.cabecalhos, linhas, notas };
    }
    const dadoNumerado = regra.id === 'tabela-a' || regra.id === 'tabela-b';
    for (const itemOriginal of itens) {
        const grupos = dadoNumerado ? [itemOriginal] : itemOriginal.split(/;\s*/);
        for (const item of grupos) {
            const numerado = dadoNumerado ? item.match(/^(\d{1,2})\s+(.+)$/) : null;
            if (numerado) { linhas.push([numerado[1],numerado[2]]); continue; }
            const indice = item.indexOf(':');
            if (indice > 0 && indice < item.length - 1) {
                linhas.push([item.slice(0,indice).trim(),item.slice(indice + 1).trim()]);
            } else {
                notas.push(item);
            }
        }
    }
    return { cabecalhos:dadoNumerado?['Dado (1d12)','Resultado']:['Referência','Regra / valor'], linhas, notas };
}
