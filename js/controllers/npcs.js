import { porId, elemento, mensagemLista } from '../core/dom.js';
import { montarCamposDinamicosNpc, atualizarGotasNpc } from '../modules/formularioNpc.js';
import { mostrarAviso, executar } from '../core/feedback.js';
import {
    ARMAS_NPC, CONDICOES_NPC, DISTANCIAS_NPC, LIMITE_NPCS,
    TRACOS_NPC, criarNpc, normalizarNpc, validarNpc,
} from '../modules/npcs.js';

/** Criação, consulta, edição e exclusão de NPCs da campanha ativa. */
export function criarControladorNpcs({ estado }) {
    let selecionadoId = null;
    let editando = null;
    let alterado = false;
    let escopoAnterior = '';
    let imagemPendente = '';
    const imagemPadrao = 'assets/imgs/imagemPersonagemPlaceholder.png';
    function atualizarPreview() { porId('npc-imagem-preview').src = imagemPendente || imagemPadrao; }

    const escopoAtual = () => `${estado.usuario?.id ?? ''}:${estado.campanhaId ?? ''}`;
    const npcSelecionado = () => estado.npcs.find((npc) => npc.id === selecionadoId);
    const valor = (id) => porId(id).value;
    const escrever = (id, texto) => { porId(id).value = texto ?? ''; };

    // Ponte entre o HTML original do Jogador e o modelo persistente do Mestre.
    const original = (id) => document.getElementById(`npc-orig-${id}`);
    const campos = {
        'nome-personagem': 'nome', 'apelido-personagem': 'apelido',
        'profissao-personagem': 'profissao', 'lingua-personagem': 'linguas',
        fama: 'fama', palavra: 'palavra', dinheiro: 'dinheiro',
        'bio-personagem': 'descricao', papel: 'papel', notas: 'notas',
        'espaco-maximo-jogador': 'capacidadePersonagem',
        'espaco-maximo-montaria': 'capacidadeMontaria',
    };
    function lerCamposOriginais(dados) {
        for (const [id, chave] of Object.entries(campos)) {
            if (original(id)) dados[chave] = original(id).value;
        }
        for (const [indice, nome] of TRACOS_NPC.entries()) {
            const checks = [...document.querySelectorAll(`[data-grupo="traco-${indice + 1}"].check-tracos`)];
            dados.tracos[nome] = checks.filter((c) => c.checked).length;
        }
        for (const [chave] of CONDICOES_NPC) {
            dados.condicoes[chave] = document.querySelectorAll(`.check-caveira[data-grupo="${chave}"]:checked`).length;
        }
        for (const [chave] of ARMAS_NPC) {
            dados.armas[chave].nome = original(`arma-${chave}`)?.value || '';
            dados.armas[chave].municao = original(`municao-${chave}`)?.value || 0;
            for (const [distancia] of DISTANCIAS_NPC) {
                dados.armas[chave].bonus[distancia] = original(`bonus-${chave}-${distancia}`)?.value || 0;
            }
        }
        dados.itens = [...document.querySelectorAll('#npc-orig-lista-itens tr')].map((tr) => ({
            local: tr.querySelector('[data-item="local"]')?.value || 'personagem',
            nome: tr.querySelector('[data-item="nome"]')?.value || '',
            quantidade: Number(tr.querySelector('[data-item="quantidade"]')?.value) || 0,
            tamanho: Number(tr.querySelector('[data-item="tamanho"]')?.value) || 0,
            descricao: tr.querySelector('[data-item="descricao"]')?.value || '',
        }));
        return dados;
    }
    function atualizarFormularioOriginal(npc) {
        for (const [id, chave] of Object.entries(campos)) {
            if (original(id)) original(id).value = npc[chave] ?? '';
        }
        for (const [indice, nome] of TRACOS_NPC.entries()) {
            const checks = [...document.querySelectorAll(`[data-grupo="traco-${indice + 1}"].check-tracos`)];
            checks.forEach((c, i) => { c.checked = i < Number(npc.tracos[nome]); });
        }
        for (const [chave] of CONDICOES_NPC) {
            document.querySelectorAll(`.check-caveira[data-grupo="${chave}"]`).forEach((c, i) => {
                c.checked = i < Number(npc.condicoes[chave]);
            });
        }
        for (const [chave] of ARMAS_NPC) {
            if (original(`arma-${chave}`)) original(`arma-${chave}`).value = npc.armas[chave].nome;
            if (original(`municao-${chave}`)) original(`municao-${chave}`).value = npc.armas[chave].municao;
            for (const [distancia] of DISTANCIAS_NPC) {
                if (original(`bonus-${chave}-${distancia}`)) original(`bonus-${chave}-${distancia}`).value = npc.armas[chave].bonus[distancia];
            }
        }
        if (original('foto-personagem')) original('foto-personagem').src = npc.imagem || 'assets/imgs/imagemPersonagemPlaceholder.png';
        const lista = original('lista-itens');
        if (lista) {
            lista.replaceChildren();
            for (const item of npc.itens || []) adicionarLinhaItem(item);
        }
    }
    function adicionarLinhaItem(item = {}) {
        const lista = original('lista-itens');
        if (!lista) return;
        const linha = document.createElement('tr');
        const colunas = [
            ['local','select',item.local || 'personagem'],
            ['nome','text',item.nome || ''],
            ['quantidade','number',item.quantidade ?? 1],
            ['tamanho','number',item.tamanho ?? 1],
            ['descricao','text',item.descricao || ''],
        ];
        for (const [chave, tipo, valor] of colunas) {
            const td = document.createElement('td');
            const campo = document.createElement(tipo === 'select' ? 'select' : 'input');
            campo.dataset.item = chave;
            if (tipo === 'select') {
                for (const local of ['personagem','montaria']) {
                    const opcao = document.createElement('option'); opcao.value = local;
                    opcao.textContent = local === 'personagem' ? 'Personagem' : 'Montaria'; campo.append(opcao);
                }
            } else { campo.type = tipo; if (tipo === 'number') { campo.min = '0'; campo.step = '1'; } }
            campo.value = String(valor);td.append(campo);linha.append(td);
        }
        const td = document.createElement('td');
        const remover = document.createElement('button');remover.type='button';remover.textContent='×';
        remover.setAttribute('aria-label','Remover item');
        remover.addEventListener('click',()=>{linha.remove();alterado=true;});td.append(remover);linha.append(td);
        lista.append(linha);
    }
    function prepararFormularioOriginal() {
        // Os botões de rolagem não fazem parte do editor; somente campos de ficha.
        const cabecalho = document.querySelector('.npc-form-reiniciado .inventario-cabecalho');
        if (cabecalho && !document.getElementById('npc-adicionar-item')) {
            const botao = document.createElement('button');botao.type='button';botao.id='npc-adicionar-item';
            botao.className='botao botao-pequeno';botao.textContent='+ Adicionar item';
            botao.addEventListener('click',()=>{adicionarLinhaItem();alterado=true;});cabecalho.append(botao);
        }
        for (const [id, alvo] of [['escolher-foto-personagem', 'personagem']]) {
            original(id)?.addEventListener('change',(evento)=>{
                const arquivo=evento.target.files?.[0];if(!arquivo)return;
                if (!['image/png','image/jpeg','image/webp'].includes(arquivo.type)||arquivo.size>350*1024) {
                    evento.target.value='';mostrarAviso('Imagem JPG, PNG ou WebP de até 350 KB.');return;
                }
                const leitor=new FileReader();leitor.onload=()=>{
                    if(!editando)return;
                    const imagem=String(leitor.result||'');
                    imagemPendente = imagem;
                    original(`foto-${alvo}`).src=imagem;alterado=true;
                };leitor.readAsDataURL(arquivo);
            });
        }
        document.querySelectorAll('.npc-form-reiniciado .check-tracos').forEach((check)=>{
            check.addEventListener('change',()=>{
                const grupo=check.dataset.grupo;
                const checks=[...document.querySelectorAll(`.npc-form-reiniciado .check-tracos[data-grupo="${grupo}"]`)];
                const indice=checks.indexOf(check);
                const nivel=check.checked?indice+1:indice;
                checks.forEach((c,i)=>{c.checked=i<nivel;});
                alterado=true;
            });
        });
    }

    function mostrarModo(modo) {
        porId('npc-vazio').hidden = modo !== 'vazio';
        porId('npc-consulta').hidden = modo !== 'consulta';
        porId('form-npc').hidden = modo === 'vazio';
        porId('form-npc').classList.toggle('npc-modo-consulta', modo === 'consulta');
        // A consulta reutiliza exatamente a ficha de criação, sem permitir alterações.
        porId('form-npc').querySelector('.campos-form-npc').inert = modo !== 'edicao';
    }

    function mostrarLista() {
        const lista = porId('lista-npcs');
        const busca = valor('buscar-npc').trim().toLocaleLowerCase('pt-BR');
        lista.replaceChildren();
        porId('total-npcs').textContent = String(estado.npcs.length);
        for (const npc of estado.npcs) {
            if (busca && !`${npc.nome} ${npc.papel} ${npc.apelido}`.toLocaleLowerCase('pt-BR').includes(busca)) continue;
            const item = elemento('li', `item-npc${npc.id === selecionadoId ? ' ativo' : ''}`);
            const botao = elemento('button');
            botao.type = 'button';
            botao.setAttribute('aria-pressed', String(npc.id === selecionadoId));
            botao.append(
                elemento('strong', '', npc.nome),
                elemento('small', '', npc.papel || 'Sem função definida'),
                elemento('span', 'npc-tipo-lista', npc.tipo === 'completa' ? 'Completa' : 'Simplificada'),
            );
            botao.addEventListener('click', () => selecionarNpc(npc.id));
            item.append(botao);
            lista.append(item);
        }
        if (!lista.children.length) mensagemLista(lista, estado.campanhaId
            ? busca ? 'Nenhum NPC corresponde à busca.' : 'Nenhum NPC criado nesta campanha.'
            : 'Selecione uma campanha para consultar os NPCs.');
    }

    function renderizarConsulta() {
        const npc = npcSelecionado();
        if (!npc) {
            mostrarModo('vazio');
            porId('npc-vazio').querySelector('p').textContent = estado.campanhaId
                ? 'Crie um NPC ou selecione uma ficha na lista para consultá-la.'
                : 'Selecione uma campanha para consultar ou criar NPCs.';
            return;
        }
        mostrarModo('consulta');
        porId('npc-nome-consulta').textContent = npc.nome;
        atualizarFormularioOriginal(npc);
    }

    function atualizarContexto() {
        const habilitado = Boolean(estado.usuario?.id && estado.campanhaId);
        porId('novo-npc').disabled = !habilitado;
        porId('buscar-npc').disabled = !habilitado;
        porId('contexto-npcs').textContent = habilitado
            ? ''
            : 'Selecione uma campanha para criar NPCs.';
    }

    function carregarCampanha() {
        const escopo = escopoAtual();
        const mudou = escopo !== escopoAnterior;
        escopoAnterior = escopo;
        estado.npcs = estado.npcsRepo?.carregar(estado.usuario?.id, estado.campanhaId) ?? [];
        if (mudou) {
            selecionadoId = null;
            editando = null;
            alterado = false;
            escrever('buscar-npc', '');
        }
        if (!estado.npcs.some((npc) => npc.id === selecionadoId)) selecionadoId = null;
        atualizarContexto();
        mostrarLista();
        renderizarConsulta();
    }

    function temAlteracoesPendentes() { return Boolean(editando && alterado); }

    function confirmarSaida() {
        return !temAlteracoesPendentes() || confirm(
            'A ficha de NPC tem alterações não salvas. Deseja descartá-las?'
        );
    }

    function descartarEdicao() {
        editando = null;
        alterado = false;
        mostrarLista();
        renderizarConsulta();
    }

    function selecionarNpc(id) {
        if (!estado.npcs.some((npc) => npc.id === id) || !confirmarSaida()) return;
        editando = null;
        alterado = false;
        selecionadoId = id;
        mostrarLista();
        renderizarConsulta();
    }

    function preencherFormulario(npc) {
        for (const campo of ['tipo', 'nome', 'papel', 'descricao', 'notas', 'apelido',
            'profissao', 'linguas', 'fama', 'palavra', 'dinheiro', 'inventario']) {
            escrever(`npc-${campo}`, npc[campo]);
        }
        escrever('npc-traco-principal', npc.tracoPrincipal);
        escrever('npc-nivel-principal', npc.nivelPrincipal);
        escrever('npc-ferimentos-simples', npc.condicoes.ferimentos);
        for (const [indice, nome] of TRACOS_NPC.entries()) {
            escrever(`npc-traco-${indice}`, npc.tracos[nome]);
        }
        for (const [chave] of CONDICOES_NPC) escrever(`npc-condicao-${chave}`, npc.condicoes[chave]);
        for (const [chave] of ARMAS_NPC) {
            escrever(`npc-arma-${chave}-nome`, npc.armas[chave].nome);
            escrever(`npc-arma-${chave}-municao`, npc.armas[chave].municao);
            for (const [distancia] of DISTANCIAS_NPC) {
                escrever(`npc-arma-${chave}-${distancia}`, npc.armas[chave].bonus[distancia]);
            }
        }
        imagemPendente = npc.imagem || '';
        atualizarPreview();
        atualizarTipo();
        atualizarGotasNpc();
        atualizarFormularioOriginal(npc);
    }

    function atualizarTipo() {
        const completa = true;
        porId('npc-campos-simples').hidden = completa;
        porId('npc-campos-completos').hidden = !completa;
        // O mesmo formulário de armas serve aos dois tipos de ficha.
        const armas = porId('npc-grade-armas');
        (completa ? armas : porId('npc-grade-armas-simples')).append(...armas.querySelectorAll('.npc-arma-form'));
        if (completa) armas.append(...porId('npc-grade-armas-simples').querySelectorAll('.npc-arma-form'));
    }

    function iniciarEdicao(npc, novo) {
        editando = structuredClone(npc);
        alterado = false;
        porId('titulo-form-npc').textContent = novo ? 'Criar NPC' : 'Editar NPC';
        preencherFormulario(npc);
        mostrarModo('edicao');
        porId('npc-nome').focus();
    }

    function criarNovo() {
        if (!estado.campanhaId) throw new Error('Selecione uma campanha antes de criar NPCs.');
        if (estado.npcs.length >= LIMITE_NPCS) throw new Error(`Limite de ${LIMITE_NPCS} NPCs atingido.`);
        if (!confirmarSaida()) return;
        iniciarEdicao(criarNpc('completa'), true);
    }

    function editarSelecionado() {
        const npc = npcSelecionado();
        if (!npc) return;
        iniciarEdicao(npc, false);
    }

    function lerFormulario() {
        const dados = structuredClone(editando);
        for (const campo of ['tipo', 'nome', 'papel', 'descricao', 'notas', 'apelido',
            'profissao', 'linguas', 'fama', 'palavra', 'dinheiro', 'inventario']) {
            dados[campo] = valor(`npc-${campo}`);
        }
        dados.imagem = imagemPendente;
        dados.tracoPrincipal = valor('npc-traco-principal');
        dados.nivelPrincipal = valor('npc-nivel-principal');
        for (const [indice, nome] of TRACOS_NPC.entries()) {
            dados.tracos[nome] = valor(`npc-traco-${indice}`);
        }
        for (const [chave] of CONDICOES_NPC) dados.condicoes[chave] = valor(`npc-condicao-${chave}`);
        for (const [chave] of ARMAS_NPC) {
            dados.armas[chave].nome = valor(`npc-arma-${chave}-nome`);
            dados.armas[chave].municao = valor(`npc-arma-${chave}-municao`);
            for (const [distancia] of DISTANCIAS_NPC) {
                dados.armas[chave].bonus[distancia] = valor(`npc-arma-${chave}-${distancia}`);
            }
        }
        if (dados.tipo === 'simples') {
            dados.condicoes.ferimentos = valor('npc-ferimentos-simples');
        }
        dados.nivelPrincipal = dados.tracos[dados.tracoPrincipal];
        dados.atualizadoEm = new Date().toISOString();
        lerCamposOriginais(dados);
        dados.tipo = 'completa';
        return validarNpc(normalizarNpc(dados));
    }

    function salvarNpc() {
        if (!editando) return;
        const npc = lerFormulario();
        const existe = estado.npcs.some((item) => item.id === npc.id);
        const lista = existe
            ? estado.npcs.map((item) => item.id === npc.id ? npc : item)
            : [...estado.npcs, npc];
        // A lista em memória só muda depois que a gravação local teve sucesso.
        const gravados = estado.npcsRepo.salvar(estado.usuario?.id, estado.campanhaId, lista);
        estado.npcs = gravados;
        selecionadoId = npc.id;
        editando = null;
        alterado = false;
        mostrarLista();
        renderizarConsulta();
        mostrarAviso('Ficha de NPC salva neste navegador.');
    }

    function salvarEdicaoPendente() {
        if (!editando) return;
        if (!porId('form-npc').reportValidity()) {
            throw new Error('Preencha os campos obrigatórios do NPC antes de salvar.');
        }
        salvarNpc();
    }

    function excluirSelecionado() {
        const npc = npcSelecionado();
        if (!npc || !confirm(`Excluir a ficha de NPC “${npc.nome}”? Esta ação não pode ser desfeita.`)) return;
        const gravados = estado.npcsRepo.salvar(estado.usuario?.id, estado.campanhaId,
            estado.npcs.filter((item) => item.id !== npc.id));
        estado.npcs = gravados;
        selecionadoId = null;
        mostrarLista();
        renderizarConsulta();
        mostrarAviso('NPC excluído desta campanha.');
    }

    function gerarNpcAleatorio() {
        if (!editando) return;
        if (alterado && !confirm('Substituir os dados atuais pelos de um NPC aleatório?')) return;
        const nomes = ['Antônio', 'Beatriz', 'Clara', 'Damião', 'Elisa', 'Francisco', 'Helena', 'Isabel', 'Joaquim', 'Luísa', 'Miguel', 'Rosa'];
        const sobrenomes = ['Almeida', 'Barros', 'Carvalho', 'Dias', 'Ferreira', 'Gomes', 'Moura', 'Nogueira', 'Pereira', 'Rocha'];
        const papeis = ['Xerife', 'Viajante', 'Comerciante', 'Ferreiro', 'Mensageiro', 'Fazendeiro', 'Guia', 'Caçador de recompensas', 'Médico', 'Informante'];
        const descricoes = ['Veste um sobretudo gasto e observa tudo com atenção.', 'Carrega um velho relógio de bolso e fala pouco.', 'Tem uma postura confiante e um chapéu marcado pelo tempo.', 'Prefere resolver conflitos por meio da conversa.', 'Conhece as trilhas e histórias da região.'];
        const escolher = (lista) => lista[Math.floor(Math.random() * lista.length)];
        escrever('npc-nome', `${escolher(nomes)} ${escolher(sobrenomes)}`);
        escrever('npc-papel', escolher(papeis));
        escrever('npc-descricao', escolher(descricoes));
        escrever('npc-notas', '');
        escrever('npc-apelido', '');
        escrever('npc-arma-primaria-nome', escolher(['Revólver', 'Espingarda', 'Carabina', 'Faca de caça']));
        escrever('npc-arma-secundaria-nome', escolher(['Faca', 'Revólver reserva', 'Porrete', '']));
        const pontos = Number(valor('npc-pontos'));
        const niveis = Array(12).fill(0);
        for (let restante = pontos; restante > 0; restante--) {
            const candidatos = niveis.map((n, i) => n < 4 ? i : -1).filter(i => i >= 0);
            niveis[escolher(candidatos)]++;
        }
        niveis.forEach((nivel, indice) => escrever(`npc-traco-${indice}`, nivel));
        atualizarGotasNpc();
        for (const [indice,nome] of TRACOS_NPC.entries()) {
            document.querySelectorAll(`.npc-form-reiniciado .check-tracos[data-grupo="traco-${indice+1}"]`).forEach((c,i)=>{c.checked=i<niveis[indice];});
        }
        for (const id of ['nome-personagem','papel','bio-personagem']) {
            if(original(id)) original(id).value = id === 'nome-personagem' ? valor('npc-nome') : id === 'papel' ? valor('npc-papel') : valor('npc-descricao');
        }
        for (const chave of ['primaria','secundaria']) if(original(`arma-${chave}`)) original(`arma-${chave}`).value = valor(`npc-arma-${chave}-nome`);
        imagemPendente = '';
        porId('npc-imagem-arquivo').value = '';
        atualizarPreview();
        alterado = true;
        mostrarAviso('NPC aleatório gerado. Revise os campos antes de salvar.');
    }

    function iniciarEventos() {
        porId('gerar-npc-aleatorio').addEventListener('click', gerarNpcAleatorio);
        porId('npc-imagem-arquivo').addEventListener('change', (evento) => {
            const arquivo = evento.target.files?.[0];
            if (!arquivo) return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type) || arquivo.size > 350 * 1024) {
                evento.target.value = '';
                mostrarAviso('Use JPG, PNG ou WebP com até 350 KB.');
                return;
            }
            const leitor = new FileReader();
            leitor.onload = () => {
                if (!editando) return;
                imagemPendente = String(leitor.result || '');
                atualizarPreview();
                alterado = true;
            };
            leitor.readAsDataURL(arquivo);
        });
        porId('npc-remover-imagem').addEventListener('click', () => {
            imagemPendente = '';
            porId('npc-imagem-arquivo').value = '';
            atualizarPreview();
            alterado = true;
        });
        montarCamposDinamicosNpc();
        prepararFormularioOriginal();
        porId('npc-sortear-tracos').addEventListener('click', () => {
            if (!editando || !confirm('Substituir os níveis atuais dos 12 traços por uma distribuição aleatória?')) return;
            const pontos = Number(valor('npc-pontos'));
            // Cada traço admite 0 a 4 pontos; a soma é sempre exata.
            const niveis = Array(12).fill(0);
            let restantes = pontos;
            while (restantes > 0) {
                const candidatos = niveis.map((nivel, indice) => nivel < 4 ? indice : -1).filter((indice) => indice >= 0);
                const indice = candidatos[Math.floor(Math.random() * candidatos.length)];
                niveis[indice]++;
                restantes--;
            }
            niveis.forEach((nivel, indice) => escrever(`npc-traco-${indice}`, nivel));
            atualizarGotasNpc();
            alterado = true;
        });
        porId('novo-npc').addEventListener('click', () => void executar(porId('novo-npc'), criarNovo));
        porId('buscar-npc').addEventListener('input', mostrarLista);
        porId('editar-npc').addEventListener('click', editarSelecionado);
        porId('excluir-npc').addEventListener('click', () => void executar(porId('excluir-npc'), excluirSelecionado));
        porId('cancelar-npc').addEventListener('click', () => {
            if (confirmarSaida()) descartarEdicao();
        });
        porId('form-npc').addEventListener('input', () => { alterado = true; });
        porId('form-npc').addEventListener('change', () => { alterado = true; });
        // Somente fichas completas; não há alternância de tipo.
        porId('form-npc').addEventListener('submit', (evento) => {
            evento.preventDefault();
            void executar(porId('salvar-npc'), salvarNpc);
        });
        atualizarContexto();
        mostrarLista();
        renderizarConsulta();
    }

    return {
        iniciarEventos, carregarCampanha, confirmarSaida, descartarEdicao,
        salvarEdicaoPendente, temAlteracoesPendentes,
    };
}
