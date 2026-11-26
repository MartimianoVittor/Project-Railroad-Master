import {
    colunasDaGrade, alturaInicialCartao, escolherTamanhoHorizontal,
    passoInteiro, ESPACAMENTO_GRADE as GAP, MIN_LADO_CARTAO,
} from '../gradeConsultas.js?v=mesa-44';
import { MECANICAS_POR_ID } from '../catalogoRegras.js?v=mesa-44';
import { montarCartao } from './cartao.js?v=mesa-44';

export function criarMedidorGrade(painel, grade) {
    let larguraGrade = 0;
    let ladoCelula = 0;
    let colunas = 12;
    const cacheTamanhos = new Map();
    const cacheMedidasManuais = new Map();
    let chaveMedidas = '';

    function larguraDisponivel() {
        const estilo = getComputedStyle(grade);
        return grade.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    }

    function larguraMudou() {
        const largura = larguraDisponivel();
        return Math.abs(largura - larguraGrade) > 1 || colunasDaGrade(largura) !== colunas;
    }

    function configurarLargura() {
        const tamanho = grade.getBoundingClientRect().width;
        if (tamanho < 50) return false; // A aba ainda está oculta.
        const largura = larguraDisponivel();
        const proximas = colunasDaGrade(largura);
        const celula = (largura - GAP * (proximas - 1)) / proximas;
        if (celula <= 0) return false;
        larguraGrade = largura;
        ladoCelula = celula;
        colunas = proximas;
        grade.style.setProperty('--util-colunas', String(colunas));
        grade.style.setProperty('--util-celula', `${celula}px`);
        const atual = `${colunas}:${celula.toFixed(2)}`;
        if (atual !== chaveMedidas) {
            cacheTamanhos.clear();
            cacheMedidasManuais.clear();
            chaveMedidas = atual;
        }
        return true;
    }
    function larguraEmCelulas(w) { return ladoCelula * w + GAP * (w - 1); }
    function linhasNecessarias(altura) {
        // A peça cobre h células mais (h - 1) espaços. Medição exata para
        // permitir tamanhos manuais ímpares sem cortar o conteúdo.
        return Math.max(MIN_LADO_CARTAO, Math.ceil((altura + GAP + 1) / (ladoCelula + GAP)));
    }
    function alturaNatural(regra, w) {
        const exemplo = montarCartao({ id:regra.id, x:0, y:0, w, h:MIN_LADO_CARTAO }, regra);
        exemplo.classList.add('util-medicao');
        exemplo.style.width = `${larguraEmCelulas(w)}px`;
        painel.append(exemplo);
        const altura = exemplo.getBoundingClientRect().height;
        const tabela = exemplo.querySelector('.util-tabela-rolagem');
        // Evita peças tão estreitas que escondam cabeçalho, controles ou tabela.
        const rolagemHorizontal = (exemplo.scrollWidth > exemplo.clientWidth + 2)
            || (!!tabela && tabela.scrollWidth > tabela.clientWidth + 2);
        exemplo.remove();
        const minimo = linhasNecessarias(altura);
        return { h:alturaInicialCartao(minimo), minimo, rolagemHorizontal };
    }
    function tamanhosDisponiveis(regra) {
        if (cacheTamanhos.has(regra.id)) return cacheTamanhos.get(regra.id);
        if (!ladoCelula || !painel || painel.hidden) return [{ w:MIN_LADO_CARTAO, h:MIN_LADO_CARTAO, rolagemHorizontal:false }];
        const opcoes = [];
        for (let w = MIN_LADO_CARTAO; w <= colunas; w += 2) {
            opcoes.push({ w, ...alturaNatural(regra, w) });
        }
        cacheTamanhos.set(regra.id, opcoes);
        return opcoes;
    }
    function minimoDeAltura(regra, largura) {
        const opcao = tamanhosDisponiveis(regra).find((p) => p.w === largura);
        if (opcao) return opcao.minimo;
        // Tamanhos automáticos são pares; larguras manuais ímpares são medidas
        // individualmente, com cache para o arraste responder rapidamente.
        const chave = `${regra.id}:${largura}`;
        if (!cacheMedidasManuais.has(chave))
            cacheMedidasManuais.set(chave, alturaNatural(regra, largura).minimo);
        return cacheMedidasManuais.get(chave);
    }
    function tamanhoPreferido(regra) {
        const opcoes = tamanhosDisponiveis(regra);
        // A leitura prevalece sobre a menor área bruta: compara proporção,
        // largura útil, altura e custo de espaço com base no conteúdo medido.
        return escolherTamanhoHorizontal(opcoes);
    }
    function dimensionarCartao(peca) {
        const regra = MECANICAS_POR_ID.get(peca.id);
        if (!regra) return peca;
        const ideal = tamanhoPreferido(regra);
        if (!peca.ajusteManual) {
            // Recalcula todas as dimensões automáticas, inclusive em consultas antigas.
            // Impede conservar alturas excessivas que foram marcadas como "manual" por engano.
            return { ...peca, w:ideal.w, h:ideal.h, manual:false,
                x:peca.posicaoManual ? peca.x : 0, y:peca.posicaoManual ? peca.y : 0 };
        }
        const w = passoInteiro(peca.w, MIN_LADO_CARTAO, colunas);
        const minimo = minimoDeAltura(regra, w);
        return { ...peca, w, h:passoInteiro(Math.max(MIN_LADO_CARTAO, peca.h, minimo), MIN_LADO_CARTAO),
            x:peca.posicaoManual ? peca.x : 0, y:peca.posicaoManual ? peca.y : 0 };
    }
    function registrarAltura(id, largura, altura) {
        const opcao = cacheTamanhos.get(id)?.find((item) => item.w === largura);
        if (!opcao) return;
        opcao.h = Math.max(opcao.h, altura);
        opcao.minimo = Math.max(opcao.minimo, altura);
    }

    return {
        configurarLargura, larguraMudou, dimensionarCartao, tamanhoPreferido, minimoDeAltura,
        larguraEmCelulas, registrarAltura,
        get colunas() { return colunas; },
        get ladoCelula() { return ladoCelula; },
    };
}
