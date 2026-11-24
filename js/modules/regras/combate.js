export const COMBATE = [
    // Capítulo 3
    {
        id: "acoes", categoria: "Combate",
        titulo: "Ações por turno", pagina: "7",
        resumo: "Cada personagem dispõe de duas ações por turno. Ajudar e tentar superar condição consomem o turno inteiro.",
        itens: [
            "Deslocar 5 m: 1 ação",
            "Deslocar 10 m: 2 ações",
            "Correr 20 m: turno inteiro",
            "Preparar: 1 ação + execução reservada: 1 ação",
        ],
    },
    {
        id: "iniciativa", categoria: "Combate",
        titulo: "Iniciativa", pagina: "7, 9",
        resumo: "Teste Orelha em Pé; ordem decrescente dos resultados. Circunstâncias concedem de −3 a +3. Empate: nova rolagem ou critério narrativo.",
        itens: [
            "Nível 0: resultado 1 + modificadores somente para ordenar",
            "Emboscadas justificadas antes da ordem comum",
        ],
    },
    {
        id: "ataque", categoria: "Combate",
        titulo: "Ataques e ferimentos", pagina: "7",
        resumo: "Ataque direto possível tem DT 5. O resultado absoluto define a consequência. Modificadores totais entre −3 e +3.",
        itens: [
            "<5: falha",
            "5–9: 1 ferimento, −1 nível total",
            "10–14: 1 ferimento, −2 níveis totais",
            "15–19: 2 ferimentos, −1 nível por ferimento",
            "20+: 2 ferimentos, −2 níveis por ferimento",
        ],
    },
    {
        id: "cobertura", categoria: "Combate",
        titulo: "Cobertura e linha de ataque", pagina: "7",
        resumo: "Cobertura completa bloqueia ataque direto sem linha de ataque; outras coberturas concedem penalidades.",
        itens: [
            "Parcial: −1",
            "Significativa: −2",
            "Quase completa: −3",
            "Completa: ataque direto bloqueado",
        ],
    },
    {
        id: "ajuda-combate", categoria: "Combate",
        titulo: "Ajudar no confronto", pagina: "7–9",
        resumo: "Ajudar consome o turno. O ajudante passa a agir imediatamente após o beneficiado e mantém a nova posição na iniciativa.",
        itens: [
            "Falha do ajudante: −1",
            "Sucesso de grau n: +n",
            "Limite final: −3 a +3",
        ],
    },
    {
        id: "preparadas", categoria: "Combate",
        titulo: "Ações preparadas", pagina: "7–8",
        resumo: "Preparar exige uma ação e gatilho observável. Executar exige outra ação previamente reservada. Só uma preparação por vez; pode persistir entre rodadas.",
        itens: [
            "Interrupções em cadeia: última ativada resolve primeiro",
            "Ação pode ser cancelada ou interrompida",
        ],
    },
    {
        id: "duelos", categoria: "Combate",
        titulo: "Duelos", pagina: "9",
        resumo: "Rolagens simultâneas. Ambos <5: nenhum acerta; um único sucesso: ele acerta; dois sucessos: prevalece o total maior.",
        itens: [
            "Empate entre resultados válidos: ambos acertam",
        ],
    },
    {
        id: "mirar", categoria: "Combate",
        titulo: "Mirar, cobertura e furtividade", pagina: "9",
        resumo: "Mirar custa uma ação; pode conceder bônus circunstancial (em geral +1) até mover, disparar ou agir de modo incompatível. Esconder-se depende do cenário e da ordem das ações.",
    },
    {
        id: "emboscada", categoria: "Combate",
        titulo: "Emboscadas", pagina: "7, 9",
        resumo: "Surpresa, ocultação ou preparo podem permitir execução antes da iniciativa comum sem alterar a ordem permanente. Preparar e executar custam ações distintas.",
    },
    {
        id: "estado-critico", categoria: "Combate",
        titulo: "Última Resistência", pagina: "7, 15–16",
        resumo: "Ao atingir três ferimentos, na primeira ocorrência após o interlúdio, teste Sangue Quente DT 5. Sucesso: Estado Crítico e incapacidade; exige cuidados e recuperar ao menos um ferimento.",
    },

    // Capítulo 4
    {
        id: "cond-movimento", categoria: "Condições e armadilhas",
        titulo: "Condições de movimento", pagina: "10",
        resumo: "Restrições físicas são mantidas além do teto de modificadores.",
        itens: [
            "Imobilizado: não se desloca voluntariamente",
            "Caído: −1 em ações posturais; não corre",
            "Lento: movimento pela metade; não corre",
            "Desarmado: não usa item perdido",
            "Pesado: metade do movimento; sem correr; −1 físico",
        ],
    },
    {
        id: "cond-mentais", categoria: "Condições e armadilhas",
        titulo: "Condições sensoriais e mentais", pagina: "10",
        resumo: "Penalidades dependem da ação e da condição presente.",
        itens: [
            "Cego: −3 em ações que dependem da visão",
            "Surdo: −3 em ações que dependem da audição",
            "Desorientado: −2 em localização/precisão",
            "Abalado: −1 em todos os testes",
            "Atordoado: apenas uma ação por turno",
            "Amedrontado: −2 em ações afetadas",
            "Confuso: −2 em concentração/planejamento",
            "Exposto: −2 em situações de vulnerabilidade",
        ],
    },
    {
        id: "cond-duracao", categoria: "Condições e armadilhas",
        titulo: "Duração e superação de condições", pagina: "10",
        resumo: "Duração padrão de um turno por grau original, salvo exceção. Superar exige turno inteiro e teste adequado DT = 5 × grau. Eliminar a causa também pode encerrar a condição.",
    },
    {
        id: "cond-acumulo", categoria: "Condições e armadilhas",
        titulo: "Acúmulo de condições", pagina: "10",
        resumo: "Some modificadores numéricos e limite a −3/+3. Restrições, como uma única ação ou impossibilidade de correr, permanecem.",
    },
    {
        id: "armadilhas", categoria: "Condições e armadilhas",
        titulo: "Armadilhas", pagina: "11",
        resumo: "Preparar exige ação plausível e teste pertinente, geralmente Guerreiro Ancestral. Sem dano, aplica condição por grau de sucesso; impedimento físico persistente não desaparece por rolagem.",
        itens: [
            "Superar: turno inteiro",
            "DT: limite inferior do grau original (grau 2 → DT 10)",
        ],
    },
    {
        id: "efeito-area", categoria: "Condições e armadilhas",
        titulo: "Efeitos em área", pagina: "11",
        resumo: "Explosivos fictícios e efeitos em área usam testes e graus gerais. Apenas alvos efetivamente expostos são afetados; cobertura e barreiras podem impedir efeitos.",
    },

    // Capítulo 5
    {
        id: "distancias", categoria: "Armas e alcance",
        titulo: "Faixas de distância", pagina: "12",
        resumo: "As distâncias são categorias abstratas para ataques e alcance.",
        itens: [
            "Corpo a corpo: 0–2 m",
            "Curta: >2–5 m",
            "Média: >5–20 m",
            "Longa: >20–80 m",
            "Extrema: >80 m",
        ],
    },
    {
        id: "armas-perfis", categoria: "Armas e alcance",
        titulo: "Perfis de ataque por alcance", pagina: "23",
        resumo: "Ordem das faixas: corpo a corpo / curta / média / longa / extrema. “—” impede ataque direto na faixa.",
        itens: [
            "Corpo a corpo: +3 / — / — / — / —",
            "Arremesso tradicional: 0 / +2 / −2 / — / —",
            "Arremesso moderno: 0 / +1 / 0 / — / —",
            "Arco tradicional: −2 / +1 / +1 / −2 / —",
            "Revólver/pistola: 0 / +2 / 0 / −2 / —",
            "Espingarda: 0 / +3 / −1 / −3 / —",
            "Carabina/rifle: −1 / 0 / +2 / +1 / —",
            "Rifle com mira: — / −3 / 0 / +3 / −3",
            "Arma montada: 0 / −2 / +1 / +2 / −3",
        ],
    },
    {
        id: "armas-recarga", categoria: "Armas e alcance",
        titulo: "Munição e recarga", pagina: "12",
        resumo: "Armas começam descarregadas. A munição é comprada separadamente e contabilizada por unidade. Recarregar custa uma ação, até a capacidade da arma.",
    },
    {
        id: "armas-modificacao", categoria: "Armas e alcance",
        titulo: "Modificações de equipamento", pagina: "12, 17",
        resumo: "Cada arma ou equipamento admite uma modificação, que normalmente altera em 1 ponto um valor numérico. Exige teste, kit e trabalho; alcance impossível continua inviável.",
    },
    {
        id: "armas-compactas", categoria: "Armas e alcance",
        titulo: "Armas compactas e ocultação", pagina: "12",
        resumo: "Tamanho e ocultabilidade podem justificar bônus circunstanciais em Passos na Sombra, respeitando o teto geral.",
    },
];
