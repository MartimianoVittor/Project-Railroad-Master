import { porId, elemento } from '../../core/dom.js?v=mesa-34';
import { inteiroNaoNegativo } from './modelo.js?v=mesa-34';

export function iniciarSeletorViajante({ grupo, disponiveis, carregarNomesJogadores, aoConfirmar }) {
    let viajanteEscolhido = '';
    let viajanteEditando = null;
    const desenharDisponiveis = () => {
        const lista = porId('vg-disponiveis');
        const busca = porId('vg-busca-viajante').value.trim().toLocaleLowerCase('pt-BR');
        const candidatos = disponiveis().filter(viajante => !grupo()?.viajantes.some(integrante => integrante.id === viajante.id));
        lista.replaceChildren();
        for (const viajante of candidatos.filter(viajante => `${viajante.nome} ${viajante.responsavel}`.toLocaleLowerCase('pt-BR').includes(busca))) {
            const opcao = elemento('button', 'vg-opcao-viajante' + (viajanteEscolhido === viajante.id ? ' selecionado' : ''), '');
            opcao.type = 'button';
            opcao.setAttribute('aria-pressed', String(viajanteEscolhido === viajante.id));
            opcao.append(elemento('strong', '', viajante.nome), elemento('small', '', viajante.responsavel));
            opcao.onclick = () => {
                viajanteEscolhido = viajante.id;
                porId('vg-escolhido').textContent = `Selecionado: ${viajante.nome} (${viajante.responsavel})`;
                porId('vg-confirmar-viajante').disabled = false;
                desenharDisponiveis();
            };
            lista.append(opcao);
        }
        if (!lista.children.length)
            lista.append(elemento('p', 'vg-vazio rr-estado-vazio rr-estado-vazio--compacto', candidatos.length ? 'Nenhum personagem encontrado.' : 'Nenhum personagem ou NPC disponível.'));
    };
    porId('vg-busca-viajante').oninput = desenharDisponiveis;
    for (const id of ['vg-km', 'vg-km-descanso']) {
        porId(id).addEventListener('change', () => {
            const distancia = Number(porId(id).value);
            if (Number.isFinite(distancia) && distancia > 0) porId(id).value = String(inteiroNaoNegativo(distancia));
        });
    }
    const abrirModalViajante = (alvo = null) => {
        viajanteEditando = alvo?.id || null;
        viajanteEscolhido = alvo?.id || '';
        porId('vg-busca-viajante').value = '';
        porId('vg-viajante-titulo').textContent = alvo ? 'Editar viajante' : 'Adicionar viajante';
        porId('vg-busca-viajante').closest('label').hidden = !!alvo;
        porId('vg-disponiveis').hidden = !!alvo;
        porId('vg-escolhido').textContent = alvo ? `Editando: ${alvo.nome} (${alvo.responsavel})` : 'Selecione um personagem na lista.';
        porId('vg-confirmar-viajante').textContent = alvo ? 'Salvar alterações' : 'Adicionar viajante';
        porId('vg-confirmar-viajante').dataset.acao = alvo ? 'editar' : 'adicionar';
        porId('vg-confirmar-viajante').disabled = !alvo;
        porId('vg-montaria').value = alvo?.montaria || '';
        porId('vg-km').value = alvo?.km ?? '30';
        porId('vg-km-descanso').value = alvo?.kmDescanso ?? '';
        if (!alvo)
            desenharDisponiveis();
        porId('vg-dialog-viajante').showModal();
        (alvo ? porId('vg-km-descanso') : porId('vg-busca-viajante')).focus();
        if (!alvo)
            void carregarNomesJogadores().then(() => {
                if (porId('vg-dialog-viajante').open)
                    desenharDisponiveis();
            });
    };

    porId('vg-adicionar').onclick = () => abrirModalViajante();
    porId('vg-form-viajante').onsubmit = e => {
        e.preventDefault();
        const grupoAtual = grupo();
        if (!grupoAtual)
            return;
        const velocidadeInformada = Number(porId('vg-km').value);
        const descansoInformado = Number(porId('vg-km-descanso').value);
        if (!Number.isFinite(velocidadeInformada) || velocidadeInformada <= 0 || !Number.isFinite(descansoInformado) || descansoInformado <= 0)
            return;
        const km = inteiroNaoNegativo(velocidadeInformada);
        const kmDescanso = inteiroNaoNegativo(descansoInformado);
        let viajante;
        if (viajanteEditando) {
            viajante = grupoAtual.viajantes.find(integrante => integrante.id === viajanteEditando);
            if (!viajante)
                return;
            Object.assign(viajante, {
                montaria: porId('vg-montaria').value.trim().slice(0, 100),
                km,
                kmDescanso
            });
        } else {
            const origem = disponiveis().find(integrante => integrante.id === viajanteEscolhido);
            if (!origem || grupoAtual.viajantes.some(integrante => integrante.id === origem.id))
                return;
            viajante = {
                id: origem.id, ref: origem.ref, tipo: origem.tipo,
                nome: origem.nome, responsavel: origem.responsavel,
                montaria: porId('vg-montaria').value.trim().slice(0, 100),
                km,
                kmDescanso,
                marcas: {},
                recursos: {
                    comida: 0,
                    agua: 0
                }
            };
            grupoAtual.viajantes.push(viajante);
        }
        porId('vg-dialog-viajante').close();
        aoConfirmar(viajante);
    };
    porId('vg-cancelar-viajante').onclick = () => porId('vg-dialog-viajante').close();
    return abrirModalViajante;
}
