import { elemento, porId } from '../../core/dom.js?v=mesa-35';
import { distanciaDoDia, formatarNumero, limiteDescanso, inteiroNaoNegativo, velocidade } from './modelo.js?v=mesa-35';

export function mostrarPainelViagem({ viagens, viagem, grupo, temCampanha, selecionado, aoSelecionar, aoEditar, aoRemover }) {
    const seletorViagem = porId('vg-viagem');
    seletorViagem.replaceChildren();
    for (const item of viagens) {
        const opcao = elemento('option', '', item.nome);
        opcao.value = item.id;
        seletorViagem.append(opcao);
    }
    if (!viagens.length)
        seletorViagem.append(elemento('option', '', 'Nenhuma viagem'));
    seletorViagem.value = viagem?.id || '';
    seletorViagem.disabled = !viagens.length;
    const seletorGrupo = porId('vg-grupo');
    seletorGrupo.replaceChildren();
    for (const item of viagem?.grupos || []) {
        const opcao = elemento('option', '', item.nome);
        opcao.value = item.id;
        seletorGrupo.append(opcao);
    }
    if (!viagem?.grupos.length)
        seletorGrupo.append(elemento('option', '', 'Nenhum grupo'));
    seletorGrupo.value = grupo?.id || '';
    seletorGrupo.disabled = !grupo;
    const percorrido = inteiroNaoNegativo(grupo?.percorrido);
    const total = inteiroNaoNegativo(viagem?.total);
    const restante = Math.max(0, total - percorrido);
    porId('vg-resumo').textContent = `${formatarNumero(percorrido)} km percorridos · ${formatarNumero(restante)} km restantes · ${formatarNumero(total)} km totais`;
    porId('vg-barra').max = total || 1;
    porId('vg-barra').value = Math.min(percorrido, total);
    porId('vg-barra').setAttribute('aria-label', grupo ? `Progresso de ${grupo.nome} na viagem ${viagem.nome}` : 'Progresso da viagem');
    porId('vg-criar').disabled = !temCampanha;
    porId('vg-editar').disabled = !viagem;
    porId('vg-adicionar-grupo').disabled = !viagem;
    for (const id of ['vg-excluir-grupo', 'vg-adicionar', 'vg-ritmo', 'vg-busca', 'vg-descansar'])
        porId(id).disabled = !grupo;
    const autonomia = limiteDescanso(grupo);
    const ateDescanso = autonomia === null ? Infinity : Math.max(0, autonomia - inteiroNaoNegativo(grupo?.desde));
    porId('vg-viajar').disabled = !distanciaDoDia(viagem, grupo);
    porId('vg-viajar').title = grupo && autonomia !== null && ateDescanso <= 0 ? 'O grupo precisa descansar antes de continuar.' : '';
    porId('vg-qtd').textContent = grupo?.viajantes.length || 0;
    porId('vg-vel').textContent = `${formatarNumero(velocidade(grupo))} km/dia`;
    porId('vg-max').textContent = autonomia === null ? 'Não informada' : `${formatarNumero(autonomia)} km`;
    porId('vg-descanso').textContent = `${formatarNumero(grupo?.desde || 0)} km`;
    porId('vg-ritmo').value = grupo?.ritmo || 'normal';
    porId('vg-busca').value = grupo?.busca === 'normal' ? 'nenhuma' : (grupo?.busca || 'nenhuma');
    const lista = porId('vg-lista');
    lista.replaceChildren();
    if (!grupo) {
        let mensagem = 'Crie um grupo nesta viagem.';
        if (!temCampanha) mensagem = 'Selecione uma campanha.';
        else if (!viagem) mensagem = 'Crie uma viagem.';
        lista.append(elemento('p', 'rr-estado-vazio rr-estado-vazio--compacto', mensagem));
        return;
    }
    if (!grupo.viajantes.length) {
        lista.append(elemento('p', 'rr-estado-vazio rr-estado-vazio--compacto',
            'Este grupo ainda não possui viajantes.'));
    }
    for (const integrante of grupo.viajantes) {
        const cartao = elemento('div', 'vg-item');
        cartao.classList.toggle('ativo', selecionado === integrante.id);
        const abrir = elemento('button');
        abrir.type = 'button';
        const montaria = integrante.montaria || 'Sem montaria';
        const descanso = integrante.kmDescanso ? `${formatarNumero(integrante.kmDescanso)} km até descanso` : 'Descanso não informado';
        abrir.append(
            elemento('strong', '', integrante.nome),
            elemento('small', '', integrante.responsavel),
            elemento('small', '', `${montaria} · ${formatarNumero(integrante.km)} km/dia`),
            elemento('small', '', descanso),
        );
        abrir.onclick = () => aoSelecionar(integrante);
        cartao.onclick = (evento) => {
            if (!evento.target.closest('button')) abrir.click();
        };
        const editar = elemento('button', 'vg-editar-viajante', '✎');
        editar.type = 'button';
        editar.title = `Editar montaria, velocidade e descanso de ${integrante.nome}`;
        editar.setAttribute('aria-label', editar.title);
        editar.onclick = () => aoEditar(integrante);

        const remover = elemento('button', '', '×');
        remover.type = 'button';
        remover.title = 'Remover viajante';
        remover.setAttribute('aria-label', `Remover ${integrante.nome} do grupo`);
        remover.onclick = () => aoRemover(integrante);
        cartao.append(abrir, editar, remover);
        lista.append(cartao);
    }
}
