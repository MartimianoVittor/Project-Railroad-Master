export const EXPEDICAO = [
    // Capítulo 6
    {
        id: "invent-capacidade", categoria: "Inventário",
        titulo: "Capacidade pessoal", pagina: "13",
        resumo: "Cada personagem dispõe de 10 espaços, incluindo itens equipados. Roupas básicas não ocupam espaço.",
    },
    {
        id: "invent-acessorios", categoria: "Inventário",
        titulo: "Acessórios de capacidade", pagina: "13",
        resumo: "Acessórios ocupam seu próprio tamanho e só um de cada tipo equipado oferece o bônus.",
        itens: [
            "Mochila: tamanho 1, +5 espaços, $5",
            "Bolsa de viagem: 1, +3, $3",
            "Cinto utilitário: 1, +2, $3",
            "Bandoleira: 1, +2, $4",
            "Com os quatro: máximo 22 espaços totais",
        ],
    },
    {
        id: "invent-pesado", categoria: "Inventário",
        titulo: "Excesso de carga: Pesado", pagina: "10, 13",
        resumo: "Acima da capacidade, recebe Pesado: movimento pela metade, sem corrida e −1 em ações físicas pertinentes. Termina quando a carga volta ao limite.",
    },
    {
        id: "invent-montarias", categoria: "Inventário",
        titulo: "Carga de montarias e veículos", pagina: "13",
        resumo: "Carga e vagas para pessoas são contadas separadamente.",
        itens: [
            "Cavalo comum: 10 espaços, 1 cavaleiro",
            "Cavalo de corrida: 5, 1",
            "Cavalo de carga: 20, 1",
            "Carroça: 40, 2 passageiros",
            "Carruagem: 20, 4 passageiros",
        ],
    },
    {
        id: "invent-alforjes", categoria: "Inventário",
        titulo: "Alforjes e transporte pesado", pagina: "13",
        resumo: "Alforjes custam $8, ocupam 2 espaços e dão +10 à capacidade da montaria. Transporte acima da carga: metade da distância, sem ritmo acelerado e −1 em condução.",
    },
    {
        id: "invent-consumo", categoria: "Inventário",
        titulo: "Consumo diário", pagina: "13, 15",
        resumo: "Cada personagem precisa de uma ração e um consumo de água por dia. Ração avulsa ocupa um espaço e custa $1; água exige recipiente.",
    },
    {
        id: "invent-agua", categoria: "Inventário",
        titulo: "Recipientes para água", pagina: "13, 25",
        resumo: "O tamanho do recipiente é fixo independentemente da quantidade armazenada. Conteúdo não ocupa espaços extras.",
        itens: [
            "Garrafa: tam. 1, 1 consumo, $1",
            "Cantil: tam. 1, 3 consumos, $2",
            "Odre: tam. 2, 6 consumos, $4",
            "Galão: tam. 3, 10 consumos, $5",
            "Barril: tam. 8, 30 consumos, $12 (veículo)",
        ],
    },
    {
        id: "invent-alimentos", categoria: "Inventário",
        titulo: "Recipientes para alimentos", pagina: "13, 25",
        resumo: "Recipientes têm tamanho fixo. Os recipientes de alimento são vendidos abastecidos; reabastecer custa $1 por ração.",
        itens: [
            "Ração avulsa: tam. 1, 1 ração, $1",
            "Bolsa: tam. 2, 5 rações, $3",
            "Caixa: tam. 4, 12 rações, $8",
            "Saco: tam. 6, 20 rações, $12",
            "Barril: tam. 10, 40 rações, $25 (veículo)",
        ],
    },

    // Capítulo 7
    {
        id: "viagem-distancias", categoria: "Viagens",
        titulo: "Distâncias por dia", pagina: "14",
        resumo: "A tabela combina transporte e ritmo. Valores em km/dia: cauteloso / normal / acelerado.",
        itens: [
            "A pé: 12,5 / 25 / 37,5",
            "Cavalo comum: 20 / 40 / 60",
            "Cavalo de corrida: 25 / 50 / 75",
            "Cavalo de carga: 15 / 30 / 45",
            "Carroça: 10 / 20 / 30",
            "Carruagem: 20 / 40 / 60",
        ],
    },
    {
        id: "viagem-grupo", categoria: "Viagens",
        titulo: "Ritmo coletivo", pagina: "14",
        resumo: "O integrante ou transporte mais lento determina a distância e o ritmo do grupo. Subgrupos separados mantêm contagens próprias.",
    },
    {
        id: "viagem-ritmo", categoria: "Viagens",
        titulo: "Efeitos do ritmo de viagem", pagina: "14",
        resumo: "Cauteloso: +1 em percepção ou orientação pertinentes. Normal: sem ajuste. Acelerado: −1 e teste de Poeira e Ossos DT 10 no fim do dia; falha gera uma marca de cansaço.",
    },
    {
        id: "viagem-busca", categoria: "Viagens",
        titulo: "Busca de recursos na estrada", pagina: "14",
        resumo: "O mestre escolhe traço pertinente e usa DT 5 como referência. O grau indica quantas pessoas recebem recursos por um dia.",
        itens: [
            "Rápida: 75% da distância normal, +0",
            "Dedicada: 50% da distância normal, +1",
            "Grau 1/2/3/4: recursos para 1/2/3/4 pessoas",
            "Grau 5+: possível abundância",
        ],
    },
    {
        id: "viagem-cuidados", categoria: "Viagens",
        titulo: "Resistência de transportes", pagina: "14",
        resumo: "Montarias e veículos acumulam km até precisarem de um dia de cuidados. Alternativa: teste coletivo Poeira e Ossos DT 5 em condições adequadas.",
        itens: [
            "Cavalo comum: 120 km",
            "Cavalo de corrida: 100 km",
            "Cavalo de carga: 120 km",
            "Carroça: 80 km",
            "Carruagem: 120 km",
        ],
    },
    {
        id: "viagem-gestao", categoria: "Viagens",
        titulo: "Responsabilidade em viagem", pagina: "14",
        resumo: "O mestre acompanha distância, dias e obstáculos. Jogadores acompanham provisões e equipamentos. Terreno e clima podem alterar o percurso.",
    },

    // Capítulo 8
    {
        id: "sobre-necessidades", categoria: "Sobrevivência",
        titulo: "Três necessidades diárias", pagina: "15–16",
        resumo: "Uma vez por dia ou por sessão (o que vier primeiro), verifique alimentação, água e pelo menos seis horas de descanso. Não duplique a cobrança no mesmo período.",
    },
    {
        id: "sobre-marcas", categoria: "Sobrevivência",
        titulo: "Marcas de fome, sede e cansaço", pagina: "15–16",
        resumo: "Necessidade não atendida: +1 marca. Atender à necessidade evita nova marca e remove 1 da contagem atual; ferimentos antigos permanecem.",
        itens: [
            "Cada marcador admite até 3 marcas",
            "3 marcas: 1 ferimento (ressalvada resistência inicial)",
            "Nova privação com 3 marcas: outro ferimento, máximo 1 por período",
        ],
    },
    {
        id: "sobre-resistencia", categoria: "Sobrevivência",
        titulo: "Resistência à privação", pagina: "15–16",
        resumo: "Na primeira vez que uma privação alcança 3 marcas, teste Poeira e Ossos DT 10 para evitar o ferimento. Renova após interlúdio ou três dias completos de recuperação.",
    },
    {
        id: "sobre-recuperacao", categoria: "Sobrevivência",
        titulo: "Recuperação de ferimentos", pagina: "15–16",
        resumo: "Uma marca de ferimento é removida após três dias consecutivos com alimentação, hidratação e descanso adequados, ou interlúdio apropriado. Reduções temporárias de traço acompanham a recuperação.",
    },
    {
        id: "sobre-kit", categoria: "Sobrevivência",
        titulo: "Kit de primeiros socorros", pagina: "15–16",
        resumo: "Kit custa $6 e ocupa 1 espaço. Uma tentativa de Cachola Cheia DT 10 pode reduzir a recuperação de um ferimento de 3 para 2 dias.",
        itens: [
            "Kit é consumido mesmo na falha",
            "Uma tentativa por ferimento por período de recuperação",
        ],
    },
    {
        id: "sobre-critico", categoria: "Sobrevivência",
        titulo: "Cuidados no Estado Crítico", pagina: "7, 15–16",
        resumo: "Após Última Resistência bem-sucedida, o personagem continua incapacitado. Precisa de cuidados e recuperar pelo menos uma marca para agir novamente.",
    },
];
