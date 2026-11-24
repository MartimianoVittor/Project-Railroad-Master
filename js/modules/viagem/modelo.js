const FATORES_RITMO = { cauteloso: 0.5, normal: 1, acelerado: 1.5 };
const FATORES_BUSCA = { nenhuma: 1, normal: 1, rapida: 0.75, dedicada: 0.5 };

export function inteiroNaoNegativo(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(0, Math.ceil(numero)) : 0;
}

export function formatarNumero(valor) {
    return inteiroNaoNegativo(valor).toLocaleString('pt-BR');
}

export function novoId() {
    return globalThis.crypto?.randomUUID?.() || `vg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function criarGrupo(nome) {
    return { id: novoId(), nome, percorrido: 0, desde: 0, ritmo: 'normal', busca: 'nenhuma', viajantes: [] };
}

function registros(lista) {
    return Array.isArray(lista) ? lista.filter((item) => item && typeof item === 'object') : [];
}

function selecionarId(lista, id) {
    const procurado = String(id ?? '');
    return lista.some((item) => item.id === procurado) ? procurado : (lista[0]?.id ?? null);
}

function normalizarGrupo(grupo, indice) {
    const viajantes = registros(grupo.viajantes).map((viajante) => ({
        ...viajante,
        km: inteiroNaoNegativo(viajante.km),
        kmDescanso: inteiroNaoNegativo(viajante.kmDescanso) || null,
    }));
    return {
        ...grupo, id: String(grupo.id || novoId()), nome: String(grupo.nome || `Grupo ${indice + 1}`),
        percorrido: inteiroNaoNegativo(grupo.percorrido), desde: inteiroNaoNegativo(grupo.desde),
        ritmo: grupo.ritmo || 'normal', busca: grupo.busca === 'normal' ? 'nenhuma' : (grupo.busca || 'nenhuma'),
        viajantes,
    };
}

export function normalizarViagens(dados) {
    let origem = dados?.viagens;
    // A primeira versão guardava os grupos diretamente na raiz.
    if (!Array.isArray(origem) && Array.isArray(dados?.grupos)) {
        origem = [{ nome: 'Viagem 1', total: dados.total, grupos: dados.grupos, ativo: dados.ativo }];
    }
    const viagens = registros(origem).map((viagem, indice) => {
        const grupos = registros(viagem.grupos).map(normalizarGrupo);
        return {
            ...viagem, id: String(viagem.id || novoId()), nome: String(viagem.nome || `Viagem ${indice + 1}`),
            total: inteiroNaoNegativo(viagem.total), grupos, ativo: selecionarId(grupos, viagem.ativo),
        };
    });
    return { versao: 2, viagens, ativa: selecionarId(viagens, dados?.ativa) };
}

export function limiteDescanso(grupo) {
    const viajantes = grupo?.viajantes ?? [];
    if (!viajantes.length || viajantes.some((viajante) => !inteiroNaoNegativo(viajante.kmDescanso))) return null;
    return Math.min(...viajantes.map((viajante) => inteiroNaoNegativo(viajante.kmDescanso)));
}

export function velocidade(grupo) {
    if (!grupo?.viajantes.length) return 0;
    const maisLento = Math.min(...grupo.viajantes.map((viajante) => inteiroNaoNegativo(viajante.km)));
    return inteiroNaoNegativo(maisLento * (FATORES_RITMO[grupo.ritmo] ?? 1) * (FATORES_BUSCA[grupo.busca] ?? 1));
}

export function distanciaDoDia(viagem, grupo) {
    if (!viagem || !grupo) return 0;
    const limite = limiteDescanso(grupo);
    const ateDescanso = limite === null ? Infinity : Math.max(0, limite - inteiroNaoNegativo(grupo.desde));
    const restante = Math.max(0, inteiroNaoNegativo(viagem.total) - inteiroNaoNegativo(grupo.percorrido));
    return Math.min(velocidade(grupo), restante, ateDescanso);
}
