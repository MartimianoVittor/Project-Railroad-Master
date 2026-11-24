export const FUNDAMENTOS = [
    // Capítulo 1
    {
        id: "teste", categoria: "Testes e dados",
        titulo: "Testes e dificuldades", pagina: "4",
        resumo: "Só role quando há risco ou consequência. Escolha um traço pertinente, role o dado e compare o total com a DT.",
        itens: [
            "DT 5: comum",
            "DT 10: difícil",
            "DT 15: extremamente difícil",
            "DT 20+: excepcional",
        ],
    },
    {
        id: "dado-explosivo", categoria: "Testes e dados",
        titulo: "Dados explosivos", pagina: "4",
        resumo: "No máximo do dado, role o mesmo dado de novo e some. Repita a cada novo máximo.",
        itens: [
            "Nível 1: d4",
            "Nível 2: d6",
            "Nível 3: d8",
            "Nível 4: d12",
        ],
    },
    {
        id: "nivel-zero", categoria: "Testes e dados",
        titulo: "Nível 0: Incapaz", pagina: "4–5",
        resumo: "Nível 0 usa d1 e falha automaticamente. Não pode ser compensado por modificadores nem recuperado depois.",
    },
    {
        id: "graus", categoria: "Testes e dados",
        titulo: "Graus de resultado", pagina: "4",
        resumo: "O grau depende do resultado absoluto, não da diferença para a dificuldade.",
        itens: [
            "<5: falha",
            "5–9: grau 1",
            "10–14: grau 2",
            "15–19: grau 3",
            "20–24: grau 4",
            "25–29: grau 5",
            "30+: graus seguintes a cada 5",
        ],
    },
    {
        id: "modificadores", categoria: "Testes e dados",
        titulo: "Modificadores", pagina: "4, 10",
        resumo: "Some circunstâncias, equipamentos, condições e auxílio. O modificador numérico FINAL fica entre −3 e +3. Restrições não numéricas continuam valendo.",
    },
    {
        id: "opostos", categoria: "Testes e dados",
        titulo: "Testes opostos", pagina: "4",
        resumo: "Se apenas um obtiver 5+, ele vence. Com dois sucessos, prevalece o maior total absoluto. Duas falhas não cumprem o objetivo. Empate: nova rolagem ou arbitragem, salvo regra específica.",
    },
    {
        id: "auxilio-externo", categoria: "Testes e dados",
        titulo: "Auxílio fora do combate", pagina: "7–8",
        resumo: "Um auxiliar que falha impõe −1. Cada grau de sucesso concede +1 na próxima ação pertinente; respeite o limite final −3 a +3.",
    },
    {
        id: "traco-alternativo", categoria: "Testes e dados",
        titulo: "Criatividade e traços alternativos", pagina: "4, 6",
        resumo: "O traço escolhido depende do método descrito pelo jogador. O mestre pode autorizar alternativas coerentes, preservando DT, custos e riscos.",
    },

    // Capítulo 2
    {
        id: "tracos-combate", categoria: "Personagens",
        titulo: "Traços de combate", pagina: "5–6",
        resumo: "Quatro capacidades de combate e técnica.",
        itens: [
            "Sangue Quente: corpo a corpo, armas brancas, resistência física",
            "Mira Afiada: ataques modernos à distância",
            "Guerreiro Ancestral: armas tradicionais, improvisos e armadilhas",
            "Amigo Kaboom: engenhos e armamentos extraordinários",
        ],
    },
    {
        id: "tracos-sobrevivencia", categoria: "Personagens",
        titulo: "Traços de sobrevivência", pagina: "5–6",
        resumo: "Quatro capacidades de percepção, furtividade, resistência e deslocamento.",
        itens: [
            "Orelha em Pé: percepção e iniciativa",
            "Passos na Sombra: furtividade",
            "Poeira e Ossos: resistência a privações",
            "Rédea e Sela: montaria, mapas e deslocamento",
        ],
    },
    {
        id: "tracos-social", categoria: "Personagens",
        titulo: "Traços sociais e saber", pagina: "5–6",
        resumo: "Quatro capacidades sociais e técnicas.",
        itens: [
            "Língua de Trapo: astúcia e negociação indireta",
            "Agourento: intimidação",
            "Cachola Cheia: pesquisa, medicina e mecanismos",
            "Grande Maioral: liderança e influência pública",
        ],
    },
    {
        id: "criacao-pontos", categoria: "Personagens",
        titulo: "Pontos iniciais", pagina: "5",
        resumo: "Distribua entre 12 traços de nível 0 a 4. Cada nível custa um ponto.",
        itens: [
            "Padrão: 20 pontos",
            "Herói: 25 pontos",
            "Lenda: 30 pontos",
        ],
    },
    {
        id: "dinheiro-inicial", categoria: "Personagens",
        titulo: "Dinheiro inicial", pagina: "5",
        resumo: "O grupo escolhe o valor fixo, a alternativa aleatória sem explosão ou um método definido pelo mestre.",
        itens: [
            "Padrão: $50 ou 2d10 + $35",
            "Herói: $75 ou 2d12 + $60",
            "Lenda: $110 ou 3d12 + $95",
        ],
    },
    {
        id: "evolucao", categoria: "Personagens",
        titulo: "Evolução de campanha", pagina: "5",
        resumo: "Ao término da campanha, receba 5 pontos para aumentar níveis permanentes entre 1 e 3, até o máximo 4. Pontos não gastos são perdidos.",
    },
    {
        id: "tracos-feridos", categoria: "Personagens",
        titulo: "Redução de traços", pagina: "5, 7, 15",
        resumo: "Ferimentos reduzem níveis; o jogador distribui as reduções. Níveis 1 a 3 podem ser recuperados, mas traço que atingir 0 torna-se permanentemente Incapaz.",
    },
    {
        id: "criar-usar", categoria: "Personagens",
        titulo: "Preparar não é utilizar", pagina: "6",
        resumo: "Criar, reparar ou adaptar um engenho pode requerer um traço; utilizá-lo pode exigir outro, conforme o método da ação.",
    },
];
