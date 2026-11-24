/** Personalização visual do Mestre — kit western, sem dependências externas.
 * O armazenamento guarda somente identificadores validados, nunca CSS arbitrário.
 */
const CHAVE = 'railroad.mestre.personalizacao.v1';
const FUNDOS = [
    ['pergaminho', 'Pergaminho'],
    ['tabua', 'Tábua de saloon'],
    ['couro', 'Couro escuro'],
    ['mapa-topografico', 'Mapa topográfico'],
    ['latao', 'Latão hachurado'],
    ['terracota', 'Terracota'],
    ['ferrovia', 'Trilhos de ferrovia'],
    ['jornal', 'Jornal antigo'],
    ['aco-envelhecido', 'Aço envelhecido'],
];
const BORDAS = [
    ['latonada', 'Borda latonada'],
    ['cartaz', 'Cartaz duplo'],
    ['ornamental', 'Gravura ornamental'],
    ['ferro-rebitado', 'Ferro rebitado'],
    ['ferrovia', 'Borda de ferrovia'],
    ['cantoneiras', 'Cantoneiras de cobre'],
    ['costura', 'Costura de sela'],
    ['chanfrada', 'Moldura chanfrada'],
    ['filete', 'Filete dourado'],
];
const BOTOES = [
    ['cartucho-45', 'Cartucho .45'],
    ['cartucho-12', 'Munição calibre 12'],
    ['faca-bowie', 'Faca Bowie'],
];
const RETRATOS = Object.freeze([
    ['estrela-de-xerife', 'Estrela de xerife'],
    ['cartaz-de-procurado', 'Cartaz de procurado'],
    ['camafeu-de-latao', 'Camafeu de latão'],
    ['moldura-de-latao', 'Moldura de latão'],
    ['tambor-de-revolver', 'Tambor de revólver'],
    ['placa-de-ferrovia', 'Placa de ferrovia'],
]);
const CAMPOS = [
    { chave: 'botoes', titulo: 'Botões de troca de página', descricao: 'Cartucho .45, munição 12 e Faca Bowie, todos apontados para a esquerda.', lista: BOTOES, tipo: 'botao' },
    { chave: 'retratoJogador', titulo: 'Moldura do jogador', descricao: 'Retratos dos jogadores nas fichas.', lista: RETRATOS, tipo: 'retrato' },
    { chave: 'retratoPersonagem', titulo: 'Moldura do personagem', descricao: 'Personagens, NPCs, combate e viagem.', lista: RETRATOS, tipo: 'retrato' },
    { chave: 'fundoPagina', titulo: 'Plano de fundo da página', descricao: 'Textura por trás das áreas da mesa.', lista: FUNDOS, tipo: 'fundo' },
    { chave: 'fundoPrincipal', titulo: 'Plano de fundo dos cartões principais', descricao: 'Colunas e painéis externos.', lista: FUNDOS, tipo: 'fundo' },
    { chave: 'fundoInterno', titulo: 'Plano de fundo dos cartões internos', descricao: 'Peças menores dentro dos painéis.', lista: FUNDOS, tipo: 'fundo' },
    { chave: 'bordaPrincipal', titulo: 'Borda dos cartões principais', descricao: 'Moldura das colunas e painéis.', lista: BORDAS, tipo: 'borda' },
    { chave: 'bordaInterna', titulo: 'Borda dos cartões internos', descricao: 'Acabamento das peças secundárias.', lista: BORDAS, tipo: 'borda' },
];
const PADRAO = Object.freeze(Object.fromEntries(CAMPOS.map(campo => [campo.chave, campo.chave === 'retratoPersonagem' ? 'cartaz-de-procurado' : campo.lista[0][0]])));
const SELETORES_PRINCIPAIS = [
    '#painel .cartao-campanha',
    '#pagina-diario .barra-sessoes', '#pagina-diario #diario-vazio',
    '#pagina-fichas .barra-consulta-fichas',
    '#pagina-utilitarios .util-barra-consultas',
    '#pagina-utilitarios .util-catalogo', '#pagina-utilitarios .util-consultas',
    '#pagina-viagem .vg-painel',
].join(',');
const SELETORES_INTERNOS = [
    '#painel .rr-estado-vazio',
    '#painel .item-campanha', '#painel .item-jogador',
    '#pagina-campanhas .painel-adicionar-jogador',
    '#pagina-campanhas .participante', '#pagina-campanhas .personagem-participante',
    '#pagina-fichas .ficha-parte',
    '#pagina-combate .combate-cartao', '#pagina-combate .combate-coluna > .cartao-arma',
    '#painel .item-npc', '#painel .npc-bloco', '#painel .grupo-campos-npc',
    '#painel .ficha-capacidade',
    '#painel .npc-aleatorio', '#pagina-utilitarios .util-mecanica',
    '#pagina-utilitarios .util-cartao', '#pagina-viagem .vg-ficha-cartao',
    '#pagina-viagem .vg-item', '#pagina-combate .combate-linha',
    '#painel .npc-pagina-original', '#painel .npc-ficha-secao', '#painel .ficha-secao',
].join(',');
// Janelas usam o mesmo acabamento dos painéis; registros são internos; amostras do seletor são independentes.
const SELETORES_JANELAS_INTERNOS = [
    'dialog .linha-gerenciar', 'dialog .combate-disponiveis > button',
    'dialog .combate-condicao-opcao', 'dialog .combate-condicao-personalizada',
    'dialog .vg-viajante-escolhido', 'dialog .rr-estado-vazio',
].join(',');
const ESTILOS = FUNDOS.filter(op => op[0] !== 'padrao').map(op => `rr-fundo--${op[0]}`)
    .concat(BORDAS.filter(op => op[0] !== 'padrao').map(op => `rr-borda--${op[0]}`));

export function normalizarPreferencias(valor) {
    const r = { ...PADRAO };
    if (!valor || typeof valor !== 'object') return r;
    for (const campo of CAMPOS) {
        const id = valor[campo.chave] === 'hachurada' ? 'ornamental' : valor[campo.chave];
        if (campo.lista.some(op => op[0] === id)) r[campo.chave] = id;
    }
    return r;
}

function lerPreferencias(chave = CHAVE) {
    try { return normalizarPreferencias(JSON.parse(localStorage.getItem(chave))); }
    catch { return { ...PADRAO }; }
}

function aplicarAcabamento(elemento, papel, preferencias) {
    if (elemento.dataset.rrPapel !== papel) elemento.dataset.rrPapel = papel;
    const nomes = papel === 'principal'
        ? [preferencias.fundoPrincipal, preferencias.bordaPrincipal]
        : [preferencias.fundoInterno, preferencias.bordaInterna];
    const desejadas = [
        nomes[0] === 'padrao' ? '' : `rr-fundo--${nomes[0]}`,
        nomes[1] === 'padrao' ? '' : `rr-borda--${nomes[1]}`,
    ].filter(Boolean);
    elemento.classList.remove('rr-borda--hachurada');
    for (const classe of ESTILOS) {
        if (elemento.classList.contains(classe) && !desejadas.includes(classe)) elemento.classList.remove(classe);
    }
    for (const classe of desejadas) elemento.classList.add(classe);
    elemento.classList.toggle('rr-tema-borda-ativa', nomes[1] !== 'padrao');
    elemento.classList.toggle('rr-tema-escuro', ['tabua', 'couro', 'terracota', 'ferrovia', 'aco-envelhecido'].includes(nomes[0]));
}

export function criarPersonalizacaoMestre(estado = {}) {
    const chaveConta = () => estado.modoLocal || !estado.usuario ? CHAVE : `${CHAVE}:${estado.usuario.id}`;
    let avisoSincronizacao = '';
    let revisao = 0;
    let salvando = false;
    let atuais = lerPreferencias();
    let confirmadas = { ...atuais };
    let observador;
    let agenda = false;
    const modal = () => document.getElementById('modal-personalizacao');

    function aplicarRetratos() {
        const grupos = [
            ['.rr-retrato-jogador, [data-previa-retrato="jogador"]', atuais.retratoJogador],
            ['.rr-retrato-personagem, #npc-orig-personagem .label-retrato, .npc-retrato-consulta, .combate-poster, .vg-ficha-poster, [data-previa-retrato="personagem"]', atuais.retratoPersonagem],
        ];
        for (const [seletor, variante] of grupos) {
            for (const moldura of document.querySelectorAll(seletor)) {
                moldura.classList.add('rr-retrato');
                for (const [id] of RETRATOS) moldura.classList.toggle(`rr-retrato--${id}`, id === variante);
                moldura.firstElementChild?.classList.add('rr-retrato__foto');
            }
        }
    }

    function aplicar() {
        aplicarRetratos();
        const previa = document.getElementById('previa-mestre');
        if (previa) {
            for (const classe of ESTILOS) previa.classList.remove(classe);
            previa.classList.add(`rr-fundo--${atuais.fundoPagina}`);
            const amostra = previa.querySelector('.rr-previa-botao');
            if (amostra) amostra.className = `rr-previa-botao personalizacao-amostra--botao rr-botao rr-botao--${atuais.botoes}`;
            for (const el of previa.querySelectorAll('[data-rr-papel]')) aplicarAcabamento(el, el.dataset.rrPapel, atuais);
        }
        document.documentElement.dataset.rrBotoes = atuais.botoes;
        const body = document.body;
        for (const classe of ESTILOS.filter(classe => classe.startsWith('rr-fundo--'))) body.classList.remove(classe);
        body.classList.toggle('rr-tema-pagina', atuais.fundoPagina !== 'padrao');
        if (atuais.fundoPagina !== 'padrao') body.classList.add(`rr-fundo--${atuais.fundoPagina}`);
        for (const botao of document.querySelectorAll('#navegacao-mestre .aba-cartucho')) {
            botao.classList.toggle('rr-botao', atuais.botoes !== 'padrao');
            botao.classList.remove('rr-botao--cartucho-45', 'rr-botao--cartucho-12', 'rr-botao--faca-bowie');
            if (atuais.botoes !== 'padrao') botao.classList.add(`rr-botao--${atuais.botoes}`);
        }
        for (const janela of document.querySelectorAll('dialog')) aplicarAcabamento(janela, 'principal', atuais);
        for (const elemento of document.querySelectorAll(SELETORES_JANELAS_INTERNOS)) aplicarAcabamento(elemento, 'interno', atuais);
        const painel = document.getElementById('painel');
        if (!painel) return;
        // Remover acabamentos de elementos que deixaram de ser cartões (inclusive
        // quando o painel de combate muda entre consulta e detalhe).
        for (const elemento of painel.querySelectorAll('[data-rr-papel]')) {
            if (elemento.matches(SELETORES_PRINCIPAIS) || elemento.matches(SELETORES_INTERNOS) || elemento.matches('dialog') || elemento.matches(SELETORES_JANELAS_INTERNOS)) continue;
            delete elemento.dataset.rrPapel;
            elemento.classList.remove(...ESTILOS, 'rr-borda--hachurada', 'rr-tema-borda-ativa', 'rr-tema-escuro');
        }
        for (const elemento of painel.querySelectorAll(SELETORES_PRINCIPAIS)) aplicarAcabamento(elemento, 'principal', atuais);
        for (const elemento of painel.querySelectorAll(SELETORES_INTERNOS)) {
            if (!elemento.matches(SELETORES_PRINCIPAIS) && !elemento.matches('dialog')) aplicarAcabamento(elemento, 'interno', atuais);
        }
    }

    function renderizarOpcoes() {
        const contentor = document.getElementById('personalizacao-opcoes');
        contentor.replaceChildren();
        for (const campo of CAMPOS) {
            const secao = document.createElement('fieldset');
            secao.className = 'personalizacao-grupo';
            const titulo = document.createElement('legend');
            titulo.textContent = campo.titulo;
            const descricao = document.createElement('p');
            descricao.className = 'personalizacao-grupo-descricao';
            descricao.textContent = campo.descricao;
            const opcoes = document.createElement('div');
            opcoes.className = 'personalizacao-amostras';
            for (const [valor, nome] of campo.lista) {
                const rotulo = document.createElement('label');
                rotulo.className = 'personalizacao-opcao';
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = campo.chave;
                radio.value = valor;
                radio.checked = atuais[campo.chave] === valor;
                const amostra = document.createElement('span');
                amostra.className = `personalizacao-amostra personalizacao-amostra--${campo.tipo}`;
                if (campo.tipo === 'botao') {
                    amostra.classList.add('rr-botao', `rr-botao--${valor}`);
                    const texto = document.createElement('span');
                    texto.className = 'cartucho-texto';
                    texto.textContent = 'Página';
                    amostra.append(texto);
                } else if (campo.tipo === 'retrato') {
                    amostra.classList.add('rr-retrato', `rr-retrato--${valor}`);
                } else {
                    if (valor !== 'padrao') amostra.classList.add(`rr-${campo.tipo === 'fundo' ? 'fundo' : 'borda'}--${valor}`);
                    amostra.textContent = valor === 'padrao' ? 'Railroad' : 'R R';
                }
                const legenda = document.createElement('span');
                legenda.className = 'personalizacao-opcao-nome';
                legenda.textContent = nome;
                rotulo.append(radio, amostra, legenda);
                opcoes.append(rotulo);
            }
            secao.append(titulo, descricao, opcoes);
            contentor.append(secao);
        }
    }

    function preencher() {
        const form = document.getElementById('form-personalizacao');
        for (const [chave, valor] of Object.entries(atuais)) {
            const radio = form.querySelector(`input[name="${chave}"][value="${valor}"]`);
            if (radio) radio.checked = true;
        }
    }

    function abrir() {
        ++revisao;
        confirmadas = { ...atuais };
        preencher();
        document.getElementById('estado-personalizacao').textContent = avisoSincronizacao;
        document.getElementById('modal-conta').close();
        modal().showModal();
    }

    function cancelar() {
        if (salvando) return;
        atuais = { ...confirmadas };
        aplicar();
        modal().close();
    }

    async function carregarConta() {
        const token = ++revisao;
        const usuario = estado.usuario;
        const chave = chaveConta();
        avisoSincronizacao = '';
        atuais = lerPreferencias(chave);
        confirmadas = { ...atuais };
        aplicar();
        if (!usuario || estado.modoLocal || !estado.cliente) return;
        try {
            const pendente = localStorage.getItem(`${chave}:pendente`);
            if (pendente) {
                const escolhas = normalizarPreferencias(JSON.parse(pendente));
                const {error} = await estado.cliente.from('preferencias_visuais_mestre').upsert({usuario_id: usuario.id, preferencias: escolhas, atualizado_em: new Date().toISOString()}, {onConflict:'usuario_id'});
                if (error) throw error;
                if (localStorage.getItem(`${chave}:pendente`) === pendente) localStorage.removeItem(`${chave}:pendente`);
                return;
            }
            const {data, error} = await estado.cliente.from('preferencias_visuais_mestre').select('preferencias').eq('usuario_id', usuario.id).maybeSingle();
            if (error) throw error;
            if (token !== revisao || !data?.preferencias) return;
            atuais = normalizarPreferencias(data.preferencias);
            confirmadas = { ...atuais }; aplicar(); preencher();
            localStorage.setItem(chave, JSON.stringify(atuais));
        } catch (erro) {
            if (token === revisao) avisoSincronizacao = 'Preferências locais carregadas. Sincronização indisponível: ' + erro.message;
            console.warn('Preferências do Mestre:', erro.message);
        }
    }

    async function salvar(evento) {
        evento.preventDefault();
        if (salvando) return;
        salvando = true;
        const token = ++revisao;
        const escolhas = { ...atuais };
        const status = document.getElementById('estado-personalizacao');
        const controles = [...modal().querySelectorAll('button,input')];
        controles.forEach(el => el.disabled = true);
        status.textContent = 'Salvando preferências...';
        const chave = chaveConta();
        try {
            localStorage.setItem(chave, JSON.stringify(escolhas));
            confirmadas = escolhas;
            if (estado.usuario && !estado.modoLocal) {
                localStorage.setItem(`${chave}:pendente`, JSON.stringify(escolhas));
                const {error} = await estado.cliente.from('preferencias_visuais_mestre').upsert({usuario_id: estado.usuario.id, preferencias: escolhas, atualizado_em: new Date().toISOString()}, {onConflict:'usuario_id'});
                if (error) throw error;
                localStorage.removeItem(`${chave}:pendente`);
            }
            avisoSincronizacao = '';
            if (token !== revisao) return;
            confirmadas = escolhas;
            modal().close();
        } catch (erro) {
            avisoSincronizacao = 'Falha ao concluir o salvamento: ' + erro.message + '. Se a cópia local foi gravada, ela será mantida.';
            status.textContent = avisoSincronizacao;
        }
        finally { salvando = false; controles.forEach(el => el.disabled = false); }
    }

    function iniciar() {
        renderizarOpcoes();
        const formulario = document.getElementById('form-personalizacao');
        formulario.addEventListener('change', evento => {
            const campo = CAMPOS.find(item => item.chave === evento.target.name);
            if (!campo || !campo.lista.some(op => op[0] === evento.target.value)) return;
            atuais[campo.chave] = evento.target.value;
            aplicar();
        });
        formulario.addEventListener('submit', salvar);
        document.getElementById('conta-personalizar').addEventListener('click', abrir);
        document.getElementById('fechar-personalizacao').addEventListener('click', cancelar);
        document.getElementById('cancelar-personalizacao').addEventListener('click', cancelar);
        document.getElementById('restaurar-personalizacao').addEventListener('click', () => {
            atuais = { ...PADRAO };
            preencher();
            aplicar();
        });
        modal().addEventListener('cancel', evento => { evento.preventDefault(); cancelar(); });
        aplicar();
        observador = new MutationObserver(() => {
            if (agenda) return;
            agenda = true;
            queueMicrotask(() => { agenda = false; aplicar(); });
        });
        observador.observe(document.body, { childList: true, subtree: true });
    }

    return { iniciar, aplicar, abrir, carregarConta };
}
