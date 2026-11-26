import { imagemSegura } from '../../services/imagensStorage.js?v=mesa-44';
import { porId, elemento } from '../../core/dom.js?v=mesa-44';
import { inteiroNaoNegativo, formatarNumero } from './modelo.js?v=mesa-44';

function secao(titulo, classe) {
    const cartao = elemento('section', `vg-ficha-cartao ${classe}`);
    if (titulo)
        cartao.append(elemento('h4', '', titulo));
    return cartao;
}

function identificacaoDoViajante(viajante, npc, personagem) {
    const nome = viajante.tipo === 'npc' ? npc.nome : personagem['nome-personagem'];
    const profissao = viajante.tipo === 'npc' ? (npc.papel || npc.profissao) : personagem['profissao-personagem'];
    const imagem = viajante.tipo === 'npc' ? npc.imagem : (personagem['imagem-personagem'] || personagem.foto);
    const identificacao = secao('', 'vg-ficha-identificacao');
    const retrato = elemento('img');
    retrato.alt = `Retrato de ${viajante.nome}`;
    const placeholder = 'assets/imgs/imagemPersonagemPlaceholder.webp';
    // Não exibir o ícone nativo de imagem quebrada e seu texto alternativo
    // sobre a moldura caso a URL assinada tenha expirado.
    retrato.addEventListener('error', () => {
        if (retrato.getAttribute('src') !== placeholder) retrato.src = placeholder;
        else retrato.hidden = true;
    });
    retrato.src = imagemSegura(imagem) ? imagem : placeholder;
    const identidade = elemento('div', 'vg-ficha-identidade');
    identidade.append(elemento('strong', '', nome || viajante.nome), elemento('small', '', viajante.responsavel));
    if (profissao)
        identidade.append(elemento('small', '', profissao));
    const poster = elemento('div', 'vg-ficha-poster');
    const janela = elemento('div', 'vg-ficha-poster-foto');
    janela.append(retrato);
    poster.append(janela);
    identificacao.append(poster, identidade);
    return identificacao;
}

function marcasDeSobrevivencia(viajante, npc, personagem, aoAlterar) {
    const marcas = secao('Sobrevivência', 'vg-ficha-marcas');
    const grupoMarcas = elemento('div', 'grupo-caveiras');
    for (const [campo, titulo] of [['ferimentos', 'Ferimentos'], ['sede', 'Sede'], ['fome', 'Fome'], ['cansaco', 'Cansaço']]) {
        const linha = elemento('div', 'linha-check');
        linha.append(elemento('label', '', `${titulo}:`));
        const marcadores = elemento('div', 'caveiras-box');
        const marcasOriginais = viajante.tipo === 'npc' ? npc.condicoes?.[campo] : (personagem.marcadores?.[campo] ?? personagem[campo]);
        const inicial = viajante.marcas?.[campo] ?? (Array.isArray(marcasOriginais) ? marcasOriginais.filter(Boolean).length : marcasOriginais) ?? 0;
        const valor = () => Math.min(3, inteiroNaoNegativo(viajante.marcas?.[campo] ?? inicial));
        for (let i = 1; i <= 3; i++) {
            const marcador = elemento('input', 'check-caveira');
            marcador.type = 'checkbox';
            marcador.dataset.grupo = campo;
            marcador.checked = i <= valor();
            marcador.setAttribute('aria-label', `${titulo} ${i}`);
            marcador.onchange = () => {
                viajante.marcas ||= {};
                viajante.marcas[campo] = marcador.checked ? Math.max(valor(), i) : Math.min(valor(), i - 1);
                aoAlterar();
            };
            marcadores.append(marcador);
        }
        linha.append(marcadores);
        grupoMarcas.append(linha);
    }
    marcas.append(grupoMarcas);
    return marcas;
}

function suprimentos(viajante, salvar) {
    const recursos = secao('Suprimentos', 'vg-ficha-suprimentos');
    for (const [campo, titulo] of [['comida', 'Comida'], ['agua', 'Água']]) {
        const linha = elemento('div', 'vg-ficha-recurso');
        const controles = elemento('div', 'vg-controles');
        const menos = elemento('button', '', '−');
        const mais = elemento('button', '', '+');
        const valor = elemento('input', 'vg-recurso-valor');
        menos.type = mais.type = 'button';
        valor.type = 'number';
        valor.min = '0';
        valor.step = '1';
        valor.inputMode = 'numeric';
        valor.setAttribute('aria-label', `Quantidade de ${titulo.toLowerCase()}`);
        valor.value = String(Math.max(0, Math.ceil(inteiroNaoNegativo(viajante.recursos?.[campo]))));
        const atualizar = (n) => {
            viajante.recursos ||= {};
            viajante.recursos[campo] = Math.max(0, Math.ceil(Number.isFinite(n) ? n : 0));
            valor.value = String(viajante.recursos[campo]);
            salvar();
        };
        for (const [botao, variacao] of [[menos, -1], [mais, 1]])
            botao.onclick = () => atualizar(Number(valor.value || 0) + variacao);
        valor.onchange = () => atualizar(Number(valor.value));
        controles.append(menos, valor, mais);
        linha.append(elemento('span', '', titulo), controles);
        recursos.append(linha);
    }
    return recursos;
}

function inventarioDoViajante(viajante, npc, ficha, fichaCarregada) {
    const inventario = secao('Inventário', 'vg-ficha-inventario');
    const origem = viajante.tipo === 'npc' ? (npc.itens || npc.inventario?.itens || []) : (ficha.inventario?.itens || []);
    const itens = Array.isArray(origem) ? origem : [];
    const rolagem = elemento('div', 'tabela-itens-rolagem');
    const tabela = elemento('table', 'tabela-itens');
    const thead = elemento('thead');
    const cab = elemento('tr');
    for (const titulo of ['Local', 'Item', 'Qtd.', 'Tam.', 'Descrição'])
        cab.append(elemento('th', '', titulo));
    thead.append(cab);
    tabela.append(thead);
    const tbody = elemento('tbody');
    if (!itens.length) {
        const tr = elemento('tr');
        const td = elemento('td', '', viajante.tipo === 'jogador' && !fichaCarregada ? 'Carregando inventário…' : 'Sem itens cadastrados.');
        td.colSpan = 5;
        tr.append(td);
        tbody.append(tr);
    }
    for (const item of itens.slice(0, 200)) {
        const tr = elemento('tr');
        let local = item.local || item.localizacao || 'Não definido';
        if (item.local === 'jogador' || item.local === 'personagem') local = 'Personagem';
        if (item.local === 'montaria') local = 'Montaria';
        const valores = [
            local, item.nome || 'Item', formatarNumero(item.quantidade ?? 1),
            formatarNumero(item.tamanho ?? item.tam ?? 0), item.descricao || '—',
        ];
        for (const valor of valores) tr.append(elemento('td', '', String(valor)));
        tbody.append(tr);
    }
    tabela.append(tbody);
    rolagem.append(tabela);
    inventario.append(rolagem);

    return inventario;
}

export function mostrarViajante(viajante, npc, registro, salvar) {
    const area = porId('vg-detalhe');
    if (!viajante) {
        area.replaceChildren(elemento('p', 'rr-estado-vazio', 'Selecione um viajante.'));
        return;
    }
    const ficha = registro?.dados || {};
    const personagem = viajante.tipo === 'npc' ? npc : (ficha.personagem || {});
    const painel = elemento('div', 'vg-ficha-grade');
    const aoAlterar = () => {
        salvar();
        mostrarViajante(viajante, npc, registro, salvar);
    };
    painel.append(marcasDeSobrevivencia(viajante, npc, personagem, aoAlterar), suprimentos(viajante, salvar));
    area.replaceChildren(identificacaoDoViajante(viajante, npc, personagem), painel, inventarioDoViajante(viajante, npc, ficha, Boolean(registro)));
}
