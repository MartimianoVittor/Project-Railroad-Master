/**
 * Gerador de fichas completas do Mestre.
 * As opções são sugestões narrativas, não modificam as regras do sistema.
 * Nenhum dado gerado é gravado aqui; persistência fica com o controlador de NPCs.
 */
import { TRACOS } from '../ficha/campos.js?v=mesa-35';

const NOMES = [
    'Antônio', 'Beatriz', 'Clara', 'Damião', 'Elisa', 'Francisco',
    'Helena', 'Isabel', 'Joaquim', 'Luísa', 'Miguel', 'Rosa',
    'Amélia', 'Bento', 'Cecília', 'Elias', 'Inês', 'Raul', 'Teresa', 'Vicente',
];
const SOBRENOMES = [
    'Almeida', 'Barros', 'Carvalho', 'Dias', 'Ferreira', 'Gomes',
    'Moura', 'Nogueira', 'Pereira', 'Rocha', 'Azevedo', 'Campos',
    'Duarte', 'Figueira', 'Macedo', 'Valença',
];
const APARENCIAS = [
    'Usa um chapéu marcado pela poeira da estrada.',
    'Veste um casaco antigo, cuidadosamente remendado.',
    'Carrega um relógio de bolso que raramente consulta.',
    'Traz na bagagem um caderno repleto de anotações.',
    'Mantém as botas sempre prontas para uma longa viagem.',
    'Usa um lenço colorido que contrasta com as roupas gastas.',
];
const MANEIRAS = [
    'Fala pouco, mas presta atenção aos detalhes.',
    'Tem respostas rápidas e uma memória impressionante.',
    'Costuma ouvir antes de dar sua opinião.',
    'Faz perguntas demais e revela pouco sobre si.',
    'É cordial, embora raramente confie de imediato.',
    'Prefere resolver problemas por meio de acordos.',
];
const OBJETIVOS = [
    'Encontrar uma pessoa que desapareceu da região.',
    'Conquistar a confiança dos habitantes da cidade.',
    'Recuperar documentos importantes de uma viagem antiga.',
    'Quitar uma dívida antes da próxima estação.',
    'Desvendar a origem de um mapa incompleto.',
    'Proteger um pequeno negócio das disputas locais.',
];
const SEGREDOS = [
    'Conhece uma rota esquecida, mas evita falar sobre ela.',
    'Recebe cartas de um remetente que ninguém conhece.',
    'Usa um nome diferente do que consta em documentos antigos.',
    'Guarda uma promessa feita a um antigo companheiro.',
    'Reconheceu alguém na cidade e ainda não contou a ninguém.',
    'Possui uma chave cuja fechadura ainda não encontrou.',
];
const APELIDOS = [
    'Olho Vivo', 'Poeira', 'Trilho', 'Ventania', 'Centelha',
    'Passo Leve', 'Corvo', 'Serrano', 'Paciência', 'Peregrino',
];

const ITEM = (nome, tamanho = 1, quantidade = 1, descricao = '') =>
    ({ local: 'personagem', nome, tamanho, quantidade, descricao });

/** Identificadores estáveis usados pelos seletores da interface. */
export const ARQUETIPOS_NPC = Object.freeze([
    {
        id: 'xerife', rotulo: 'Representante da lei', papel: 'Xerife', profissao: 'Agente da lei',
        tracos: ['Mira Afiada', 'Orelha Em Pé', 'Grande Maioral', 'Agourento e Carrancudo'],
        primarias: ['Revólver', 'Carabina'], secundarias: ['Bastão', 'Faca'],
        itens: [ITEM('Distintivo', 0), ITEM('Cantil'), ITEM('Caderno de ocorrências')],
    },
    {
        id: 'viajante', rotulo: 'Viajante', papel: 'Viajante', profissao: 'Explorador de estradas',
        tracos: ['Rédea e Sela', 'Poeira e Ossos', 'Orelha Em Pé', 'Passos Na Sombra'],
        primarias: ['Carabina', 'Bastão de viagem'], secundarias: ['Faca', ''],
        itens: [ITEM('Cantil'), ITEM('Mantimentos', 1, 2), ITEM('Mapa de estradas'), ITEM('Cobertor', 2)],
    },
    {
        id: 'comerciante', rotulo: 'Comerciante', papel: 'Comerciante', profissao: 'Mercador',
        tracos: ['Língua de Trapo', 'Grande Maioral', 'Cachola Cheia', 'Orelha Em Pé'],
        primarias: ['Bastão', 'Revólver'], secundarias: ['', 'Faca'],
        itens: [ITEM('Livro-caixa'), ITEM('Amostras de mercadorias', 2), ITEM('Cantil')],
    },
    {
        id: 'guia', rotulo: 'Guia e rastreador', papel: 'Guia', profissao: 'Rastreador',
        tracos: ['Orelha Em Pé', 'Rédea e Sela', 'Poeira e Ossos', 'Guerreiro Ancestral'],
        primarias: ['Arco', 'Carabina'], secundarias: ['Faca', 'Bastão'],
        itens: [ITEM('Mapa de trilhas'), ITEM('Cantil'), ITEM('Corda', 2), ITEM('Mantimentos', 1, 2)],
    },
    {
        id: 'medico', rotulo: 'Médico', papel: 'Médico', profissao: 'Médico itinerante',
        tracos: ['Cachola Cheia', 'Poeira e Ossos', 'Grande Maioral', 'Orelha Em Pé'],
        primarias: ['Bastão', ''], secundarias: ['', 'Revólver'],
        itens: [ITEM('Kit de primeiros socorros', 2), ITEM('Caderno de receitas'), ITEM('Cantil')],
    },
    {
        id: 'inventor', rotulo: 'Inventor e mecânico', papel: 'Inventor', profissao: 'Mecânico',
        tracos: ['Amigo Kaboom', 'Cachola Cheia', 'Mira Afiada', 'Poeira e Ossos'],
        primarias: ['Ferramenta improvisada', ''], secundarias: ['', 'Faca'],
        itens: [ITEM('Ferramentas e peças', 1), ITEM('Caderno de projetos'), ITEM('Cantil')],
    },
    {
        id: 'mensageiro', rotulo: 'Mensageiro', papel: 'Mensageiro', profissao: 'Estafeta',
        tracos: ['Rédea e Sela', 'Passos Na Sombra', 'Orelha Em Pé', 'Língua de Trapo'],
        primarias: ['Revólver', ''], secundarias: ['Faca', ''],
        itens: [ITEM('Bolsa de correspondência'), ITEM('Mapa de rotas'), ITEM('Cantil')],
    },
    {
        id: 'informante', rotulo: 'Informante', papel: 'Informante', profissao: 'Intermediário de informações',
        tracos: ['Língua de Trapo', 'Passos Na Sombra', 'Orelha Em Pé', 'Grande Maioral'],
        primarias: ['', 'Revólver'], secundarias: ['Faca', ''],
        itens: [ITEM('Caderno cifrado'), ITEM('Cartas antigas'), ITEM('Cantil')],
    },
    {
        id: 'fazendeiro', rotulo: 'Fazendeiro', papel: 'Fazendeiro', profissao: 'Criador de gado',
        tracos: ['Rédea e Sela', 'Poeira e Ossos', 'Sangue Quente', 'Grande Maioral'],
        primarias: ['Carabina', ''], secundarias: ['Faca', ''],
        itens: [ITEM('Cantil'), ITEM('Corda', 2), ITEM('Ferramentas de campo'), ITEM('Mantimentos')],
    },
    {
        id: 'ferreiro', rotulo: 'Ferreiro', papel: 'Artesão', profissao: 'Ferreiro',
        tracos: ['Sangue Quente', 'Cachola Cheia', 'Poeira e Ossos', 'Amigo Kaboom'],
        primarias: ['Ferramenta improvisada', ''], secundarias: ['', ''],
        itens: [ITEM('Ferramentas e peças', 2), ITEM('Avental de trabalho'), ITEM('Cantil')],
    },
    {
        id: 'ferroviario', rotulo: 'Ferroviário', papel: 'Ferroviário', profissao: 'Funcionário da estação',
        tracos: ['Cachola Cheia', 'Orelha Em Pé', 'Rédea e Sela', 'Língua de Trapo'],
        primarias: ['', 'Bastão'], secundarias: ['', ''],
        itens: [ITEM('Relógio de bolso', 0), ITEM('Tabela de horários'), ITEM('Cantil')],
    },
    {
        id: 'minerador', rotulo: 'Minerador', papel: 'Minerador', profissao: 'Prospector',
        tracos: ['Poeira e Ossos', 'Sangue Quente', 'Orelha Em Pé', 'Cachola Cheia'],
        primarias: ['Picareta', ''], secundarias: ['', ''],
        itens: [ITEM('Lanterna'), ITEM('Mapa de jazidas'), ITEM('Cantil'), ITEM('Ferramentas e peças')],
    },
    {
        id: 'professor', rotulo: 'Professor', papel: 'Educador', profissao: 'Professor de escola',
        tracos: ['Cachola Cheia', 'Grande Maioral', 'Língua de Trapo', 'Orelha Em Pé'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Livros', 2), ITEM('Caderno de lições'), ITEM('Cantil')],
    },
    {
        id: 'jornalista', rotulo: 'Jornalista', papel: 'Jornalista', profissao: 'Repórter',
        tracos: ['Língua de Trapo', 'Orelha Em Pé', 'Cachola Cheia', 'Passos Na Sombra'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Caderno de entrevistas'), ITEM('Papel e tinta'), ITEM('Cantil')],
    },
    {
        id: 'artista', rotulo: 'Artista itinerante', papel: 'Artista', profissao: 'Músico de estrada',
        tracos: ['Grande Maioral', 'Língua de Trapo', 'Orelha Em Pé', 'Passos Na Sombra'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Instrumento musical', 2), ITEM('Roupas de apresentação'), ITEM('Cantil')],
    },
    {
        id: 'cozinheiro', rotulo: 'Cozinheiro de acampamento', papel: 'Cozinheiro', profissao: 'Cozinheiro',
        tracos: ['Poeira e Ossos', 'Cachola Cheia', 'Sangue Quente', 'Grande Maioral'],
        primarias: ['', ''], secundarias: ['Faca', ''],
        itens: [ITEM('Utensílios de cozinha', 2), ITEM('Mantimentos', 1, 2), ITEM('Cantil')],
    },
    {
        id: 'cartografo', rotulo: 'Cartógrafo', papel: 'Cartógrafo', profissao: 'Topógrafo',
        tracos: ['Cachola Cheia', 'Rédea e Sela', 'Orelha Em Pé', 'Poeira e Ossos'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Mapas e bússola'), ITEM('Instrumentos de medição'), ITEM('Cantil')],
    },
    {
        id: 'dono-salao', rotulo: 'Dono de salão', papel: 'Comerciante', profissao: 'Dono de estabelecimento',
        tracos: ['Língua de Trapo', 'Grande Maioral', 'Agourento e Carrancudo', 'Orelha Em Pé'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Livro-caixa'), ITEM('Chaves do estabelecimento', 0), ITEM('Cantil')],
    },
    {
        id: 'lider-comunitario', rotulo: 'Líder comunitário', papel: 'Líder local', profissao: 'Representante da comunidade',
        tracos: ['Grande Maioral', 'Língua de Trapo', 'Cachola Cheia', 'Orelha Em Pé'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Livro de registros'), ITEM('Correspondências'), ITEM('Cantil')],
    },
    {
        id: 'botanico', rotulo: 'Naturalista', papel: 'Naturalista', profissao: 'Pesquisador de campo',
        tracos: ['Cachola Cheia', 'Poeira e Ossos', 'Orelha Em Pé', 'Guerreiro Ancestral'],
        primarias: ['', ''], secundarias: ['', ''],
        itens: [ITEM('Caderno de campo'), ITEM('Amostras de plantas'), ITEM('Cantil')],
    },
]);

const COMPORTAMENTOS = Object.freeze({
    cordial: ['Recebe visitantes com gentileza e procura ouvir todas as partes.'],
    reservado: ['Escolhe as palavras com cautela e revela pouco sobre o passado.'],
    astuto: ['Observa as intenções dos demais antes de apresentar uma proposta.'],
    impulsivo: ['Age rapidamente quando acredita ter encontrado uma solução.'],
});
const OBJETIVOS_POR_TEMA = Object.freeze({
    protecao: ['Proteger uma pessoa importante durante uma travessia.'],
    busca: ['Encontrar alguém que desapareceu da região.'],
    negocio: ['Resolver uma dívida ou negociação antes de deixar a cidade.'],
    misterio: ['Investigar um segredo escondido em documentos antigos.'],
});

function sortearOpcao(mapa, chave, alternativas, aleatorio) {
    return chave === 'aleatorio' ? escolher(alternativas, aleatorio)
        : escolher(mapa[chave] ?? alternativas, aleatorio);
}

function escolher(itens, aleatorio) {
    const numero = Number(aleatorio());
    const indice = Math.min(itens.length - 1, Math.max(0, Math.floor((Number.isFinite(numero) ? numero : 0) * itens.length)));
    return itens[indice];
}

function distribuirPontos(tracosFavoritos, pontos, aleatorio) {
    // Nível 0 é permanente no Railroad: personagens gerados começam no mínimo em 1.
    const niveis = Object.fromEntries(TRACOS.map((nome) => [nome, 1]));
    let restantes = pontos - TRACOS.length;
    // Uma especialidade real garante que o arquétipo não seja apenas cosmético.
    const principal = escolher(tracosFavoritos.slice(0, 2), aleatorio);
    niveis[principal] = 4;
    restantes -= 3;
    while (restantes > 0) {
        const disponiveis = TRACOS.filter((nome) => niveis[nome] < 4);
        const pesos = disponiveis.map((nome) => tracosFavoritos.includes(nome) ? 5 : 1);
        const total = pesos.reduce((soma, peso) => soma + peso, 0);
        let sorteio = Number(aleatorio()) * total;
        if (!Number.isFinite(sorteio)) sorteio = 0;
        let escolhido = disponiveis[disponiveis.length - 1];
        for (let i = 0; i < disponiveis.length; i++) {
            sorteio -= pesos[i];
            if (sorteio < 0) { escolhido = disponiveis[i]; break; }
        }
        niveis[escolhido]++;
        restantes--;
    }
    return { tracos: niveis, principal };
}

function prepararArma(nome) {
    const municao = nome === 'Revólver' ? 6 : nome === 'Carabina' ? 8 : 0;
    return { nome, municao, bonus: { corpo: 0, curta: 0, media: 0, longa: 0 } };
}

/**
 * Gera uma ficha editável preservando id e dados históricos. Em rascunhos com
 * inventário preenchido, não descarta os itens existentes ao sortear novamente.
 * @param {object} ficha Rascunho de NPC criado com criarNpc().
 * @param {{arquetipo?:string, pontos?:20|25|30, personalidade?:string, objetivo?:string, equipamento?:string, preservarItens?:boolean, aleatorio?:()=>number}} opcoes
 */
export function sortearDadosNpc(ficha, { arquetipo = 'aleatorio', pontos = 25, personalidade = 'aleatorio', objetivo = 'aleatorio', equipamento = 'padrao', preservarItens = true, aleatorio = Math.random } = {}) {
    if (![20, 25, 30].includes(Number(pontos))) throw new RangeError('Escolha 20, 25 ou 30 pontos de traços.');
    if (!['aleatorio', ...Object.keys(COMPORTAMENTOS)].includes(personalidade)) throw new RangeError('Comportamento inválido.');
    if (!['aleatorio', ...Object.keys(OBJETIVOS_POR_TEMA)].includes(objetivo)) throw new RangeError('Objetivo inválido.');
    if (!['padrao', 'leve', 'ampliado'].includes(equipamento)) throw new RangeError('Kit inicial inválido.');
    const npc = structuredClone(ficha);
    const perfil = ARQUETIPOS_NPC.find((item) => item.id === arquetipo)
        ?? escolher(ARQUETIPOS_NPC, aleatorio);
    const { tracos, principal } = distribuirPontos(perfil.tracos, Number(pontos), aleatorio);

    npc.tipo = 'completa';
    npc.nome = `${escolher(NOMES, aleatorio)} ${escolher(SOBRENOMES, aleatorio)}`;
    npc.apelido = escolher(APELIDOS, aleatorio);
    npc.papel = perfil.papel;
    npc.profissao = perfil.profissao;
    npc.linguas = escolher(['Comum', 'Comum e língua de fronteira', 'Comum e dialeto regional'], aleatorio);
    npc.fama = escolher(['Desconhecido', 'Conhecido na região', 'Respeitado localmente'], aleatorio);
    npc.palavra = escolher(['Confiável', 'Reservado', 'De reputação duvidosa'], aleatorio);
    npc.dinheiro = String(escolher([10, 15, 20, 25, 40, 60], aleatorio));
    npc.descricao = `${escolher(APARENCIAS, aleatorio)} ${sortearOpcao(COMPORTAMENTOS, personalidade, MANEIRAS, aleatorio)}`;
    npc.notas = `Objetivo: ${sortearOpcao(OBJETIVOS_POR_TEMA, objetivo, OBJETIVOS, aleatorio)}\nSegredo do mestre: ${escolher(SEGREDOS, aleatorio)}`;
    npc.tracos = tracos;
    npc.tracoPrincipal = principal;
    npc.nivelPrincipal = tracos[principal];
    npc.condicoes = { ferimentos: 0, sede: 0, fome: 0, cansaco: 0 };
    npc.armas = {
        primaria: prepararArma(escolher(perfil.primarias, aleatorio)),
        secundaria: prepararArma(escolher(perfil.secundarias, aleatorio)),
    };
    if (!preservarItens || !Array.isArray(npc.itens) || npc.itens.length === 0) {
        const itensPerfil = structuredClone(perfil.itens);
        if (equipamento === 'leve') {
            // Dois itens básicos; a mochila não é criada automaticamente.
            npc.itens = itensPerfil.slice(0, 2);
        } else if (equipamento === 'ampliado') {
            npc.itens = [...itensPerfil, ITEM('Mantimentos', 1, 2), ITEM('Cobertor', 2)];
        } else {
            npc.itens = itensPerfil;
        }
    }
    npc.capacidadePersonagem = Math.max(Number(npc.capacidadePersonagem) || 0, 12,
        npc.itens.filter((item) => item.local !== 'montaria')
            .reduce((total, item) => total + item.quantidade * item.tamanho, 0));
    npc.capacidadeMontaria = Math.max(Number(npc.capacidadeMontaria) || 0, 0);
    // Se já foi escolhida uma imagem pelo Mestre, ela permanece na ficha.
    return npc;
}
