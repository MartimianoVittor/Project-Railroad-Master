import { elemento, botao } from '../../core/dom.js?v=mesa-31';
import { criarParteFicha, PARTES_FICHA } from '../visualizarFicha.js?v=mesa-31';
import { TRACOS } from '../ficha/campos.js?v=mesa-31';
import { inteiro } from './combatentes.js?v=mesa-31';

export function registroNpcParaConsulta(npc, combatente) {
    const marcas = {};
    for (const chave of ['ferimentos', 'sede', 'fome', 'cansaco']) {
        const valor = chave === 'ferimentos' ? combatente.ferimentos : npc.condicoes?.[chave];
        marcas[chave] = Array.from({ length: 3 }, (_, i) => i < inteiro(valor, 0, 3));
    }
    TRACOS.forEach((nome, i) => {
        const nivel = combatente.tracos?.[nome] ?? npc.tracos?.[nome];
        marcas[`traco-${i + 1}`] = Array.from({ length: 4 }, (_, j) => j < inteiro(nivel, 0, 4));
    });
    const rolagens = {
        'espaco-maximo-jogador': npc.capacidadePersonagem || 0,
        'espaco-maximo-montaria': npc.capacidadeMontaria || 0,
    };
    for (const chaveArma of ['primaria', 'secundaria']) {
        const arma = combatente.armas?.[chaveArma] || npc.armas?.[chaveArma] || {};
        rolagens[`arma-${chaveArma}`] = arma.nome || '';
        rolagens[`municao-${chaveArma}`] = arma.municao || 0;
        for (const distancia of ['corpo', 'curta', 'media', 'longa'])
            rolagens[`bonus-${chaveArma}-${distancia}`] = arma.bonus?.[distancia] || 0;
    }
    return {
        titulo: npc.nome || combatente.nome,
        dados: {
            nome: npc.nomeJogador || 'NPC',
            apelido: npc.apelidoJogador || '',
            bio: npc.bioJogador || '',
            fotoPerfil: npc.imagemJogador || '',
            personagem: {
                foto: npc.imagem || combatente.imagem || '',
                'nome-personagem': npc.nome || combatente.nome,
                'apelido-personagem': npc.apelido || '',
                'profissao-personagem': npc.profissao || npc.papel || '',
                'lingua-personagem': npc.linguas || '',
                fama: npc.fama || '',
                palavra: npc.palavra || '',
                dinheiro: npc.dinheiro || '',
                'bio-personagem': npc.descricao || '',
                marcadores: marcas,
            },
            inventario: {
                itens: (npc.itens || []).map(item => ({
                    ...item,
                    local: item.local === 'montaria' ? 'montaria' : 'jogador',
                })),
                rolagens
            },
        },
    };
}

export function desenharConsultaFicha(combatente, area, consulta, fechar) {
    area.classList.add('combate-consulta-ficha-ativa');
    area.setAttribute('aria-busy', consulta?.status === 'carregando' ? 'true' : 'false');
    const cabecalho = elemento('header', 'combate-consulta-ficha-cabecalho');
    const titulos = elemento('div', 'combate-consulta-ficha-titulos');
    titulos.append(elemento('small', '', 'CONSULTA DE FICHA'), elemento('h2', '', combatente.nome));
    const voltar = botao('Voltar aos controles', fechar, 'botao botao-discreto combate-consulta-ficha-voltar');
    cabecalho.append(titulos, voltar);
    const conteudo = elemento('div', 'combate-consulta-ficha-conteudo');
    if (consulta.status === 'pronta') {
        conteudo.classList.add('combate-consulta-ficha-grade');
        for (const parte of Object.keys(PARTES_FICHA))
            conteudo.append(criarParteFicha(consulta.registro, parte));
    } else {
        const mensagem = consulta.status === 'carregando' ? 'Carregando a ficha do personagem…' : (consulta.mensagem || 'Não foi possível carregar a ficha.');
        conteudo.append(elemento('p', 'combate-consulta-ficha-aviso', mensagem));
    }
    area.replaceChildren(cabecalho, conteudo);
}
