export const DADOS_DE_TRACO = Object.freeze([4, 6, 8, 12]);

// O limite acompanha o histórico da mesa. O nível zero fica a cargo de cada uso.
export function rolarTraco(nivel, aleatorio = Math.random) {
    const faces = DADOS_DE_TRACO[nivel - 1] ?? 1;
    if (faces === 1) return { faces, dados: [1], soma: 1 };

    const dados = [];
    let soma = 0;
    do {
        const dado = 1 + Math.floor(aleatorio() * faces);
        dados.push(dado);
        soma += dado;
        if (dado < faces) break;
    } while (dados.length < 100);

    return { faces, dados, soma };
}
