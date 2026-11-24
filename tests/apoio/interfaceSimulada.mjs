/** Elementos usados nos testes de ciclo de sessão e de salvamento do Diário. */
export function montarInterface(t) {
    const campos = new Map();
    function elemento() {
        const eventos = new Map();
        return {
            value: '', classList: { add() {}, remove() {}, toggle() {} },
            append() {}, replaceChildren() {}, querySelector: () => ({}),
            addEventListener: (nome, acao) => eventos.set(nome, acao),
            clicar() { eventos.get('click')?.({ currentTarget: this }); },
        };
    }
    function porId(id) {
        if (!campos.has(id)) campos.set(id, elemento());
        return campos.get(id);
    }
    globalThis.document = { getElementById: porId, createElement: elemento, body: elemento(), documentElement: elemento() };
    t.mock.method(globalThis, 'setTimeout', () => 0);
    t.after(() => { delete globalThis.document; });
    return porId;
}

export function adiarResposta() {
    let concluir;
    const resposta = new Promise((resolve) => { concluir = resolve; });
    return { resposta, concluir };
}
