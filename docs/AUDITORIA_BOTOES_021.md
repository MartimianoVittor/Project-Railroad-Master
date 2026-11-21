# Railroad Mestre — Auditoria visual e funcional de botões (v21)

**Base analisada:** Railroad Mestre, atualização 20 (layout, botões e Supabase); comparação visual e de CSS com a versão Railroad Jogador disponível no projeto.

## Princípio de desenho

A cor identifica uma intenção, mas a hierarquia depende também de **posição, tamanho, quantidade, contexto e proximidade**. Quatro botões com igual tamanho e preenchimentos muito fortes fazem o usuário ler tudo como igualmente urgente — mesmo quando uma ação é rotineira e outra é destrutiva.

A revisão passa a usar os seguintes papéis:

| Papel | Aparência | Exemplos | Observação |
| --- | --- | --- | --- |
| Criação principal | Amarelo-ouro sólido | Criar viagem; Adicionar combatente; Criar NPC | No máximo um destaque amarelo por **grupo de ações próximo**, sem proibir destaques em cartões independentes |
| Confirmação / execução | Marrom sólido, texto claro | Salvar; Passar turno; Viajar um dia; Rolar traço | Deve aparecer depois das alternativas auxiliares quando a ordem de leitura exigir |
| Apoio e navegação | Bege | Modificar; Gerenciar; Descansar; Cancelar; Selecionar | Não compete visualmente com o objetivo principal |
| Perigo em barra ou lista | Bege avermelhado, borda e texto vermelho | Encerrar combate; Excluir grupo; Excluir NPC; Limpar | O vermelho sólido só aparece ao passar o mouse; o texto deixa explícita a ação |
| Confirmação destrutiva em diálogo | Vermelho sólido | Excluir viagem no formulário | É intencionalmente mais forte porque a decisão está sendo confirmada |
| Ferramentas e microcontroles | Bege neutro ou marrom ativo | Munição ±, edição ✎, ferramentas do quadro | A dimensão acompanha o controle; não recebe as cores de botões grandes |

## Revisão por página

### Viagens

**Antes:** os quatro botões do cabeçalho eram tratados como uma matriz de quatro ações concorrentes: dois amarelos e um vermelho sólido. Criar viagem e adicionar grupo pareciam igualmente importantes; excluir grupo atraía atenção excessiva.

**Depois:** dois conjuntos semânticos, cada um com duas ações alinhadas:

1. **Viagem:** Criar viagem (amarelo) e Modificar viagem (bege).
2. **Grupo:** Adicionar grupo (bege contextual, identificado pelo `+`) e Excluir grupo (perigo discreto).

A linha divisória leve cria agrupamento sem aumentar a quantidade de cartões nem multiplicar títulos. No cartão Viajantes, **Adicionar viajante** continua amarelo porque é a ação principal daquele cartão independente. Em Dados gerais, **Descansar** fica bege e **Viajar um dia** permanece marrom; o botão de execução fica à direita. No diálogo de viagem, **Excluir viagem** permanece vermelho sólido e separado das ações Cancelar/Confirmar. Os controles ± dos suprimentos e o lápis do viajante continuam compactos.

### Combate

A barra superior deve comunicar primeiro o avanço natural do turno: **Passar** (marrom). **Encerrar combate** é perigoso, mas não precisa ser um grande bloco vermelho durante a sessão; passou a receber contorno vermelho discreto, com espaçamento adicional. **Adicionar combatente** fica amarelo no cabeçalho da lista, onde é a ação local principal. **Rolar traço** permanece marrom dentro do cartão de rolagem. Remover combatente ou condição utiliza controle menor, de fundo suave e símbolo inequívoco, evitando que vários X vermelhos concorram com o fluxo do turno.

### NPCs

**Criar NPC** (amarelo) permanece ao lado do título. Na consulta, **Editar** (bege) precede **Excluir** (contorno vermelho). No editor, **Gerar aleatório** (bege) é auxiliar, **Cancelar** (bege) é reversível e **Salvar NPC** (marrom) concentra a confirmação. A inclusão local de itens continua compacta.

### Campanhas

**Criar campanha** e **Adicionar jogador** são ações de criação em cartões/contextos diferentes, por isso podem ser amarelas. A lista agora organiza os comandos de cada campanha como **Selecionar** seguido de **Excluir**, preservando a ação comum antes do perigo. O botão Selecionar não deve ser dourado continuamente; a campanha ativa já possui destaque próprio. **Salvar** na barra superior usa marrom para não competir com a aba de navegação ativa, que já usa dourado. **Sair** mantém o estilo discreto próprio da barra escura.

### Diário / Sessões

Na barra superior, a sequência **Adicionar sessão** (amarelo), **Salvar** (marrom) e **Gerenciar** (bege) cria uma leitura clara de criação, confirmação e administração. **Limpar marcos** é perigo de contorno, sem competir com o texto. No gerenciador, mover, editar e duplicar continuam neutros; a ação Excluir, última no conjunto, recebe contorno vermelho. As ferramentas do quadro, por se comportarem como **modos selecionáveis**, continuam uma família visual separada: neutras quando inativas, marrom ao selecionar uma ferramenta, e perigo discreto para Limpar.

### Fichas, Inventário e ferramentas

Os indicadores e ações auxiliares relacionados às fichas permanecem nas famílias originais do Jogador: controles de munição, marcadores e seletores não devem adotar preenchimento amarelo/marrom só por serem clicáveis. A folha do Jogador não é modificada por este pacote; ela serviu como referência para proporções, paleta e contraste.

## Regras de disposição

- Aproximar botões que atuam sobre o mesmo objeto; separar grupos de contextos diferentes.
- Priorizar a ação cotidiana e colocar perigo no fim do conjunto de leitura.
- Conservar alturas, raio e fonte consistentes **dentro da mesma barra**; controles ± e ícones são exceções intencionais.
- Evitar mais de uma ação grande e dourada dentro da mesma barra, mesmo quando ambas significam “adicionar”.
- O estado `disabled` precisa continuar compreensível, sem converter um botão desativado em uma nova cor semântica.
- Conservar foco visível, texto explícito, `aria-label` dos ícones e layout responsivo.
- Usar a classe `.rr-perigo-discreto` em novas barras/listas; reservar `.rr-botao-vermelho` para ações destrutivas cuja confirmação já está clara.

## Arquivos da atualização 21

- `css/botoes-railroad.css`: tokens e padronização contextual, inclusive microcontroles, navegação superior e ações destrutivas discretas.
- `views/pages/viagem.html`: agrupamento semântico das duas linhas de ações do cabeçalho, sem alterar IDs ou eventos.
- `js/controllers/campanhas.js`: troca da ordem dos dois botões por campanha — **Selecionar** antes de **Excluir**, mantendo as funções.
- `docs/AUDITORIA_BOTOES_021.md`: este documento.

## Validação e limites

- 59 testes automatizados do projeto Mestre aprovados com os arquivos atualizados.
- Conferência de cores computadas e layout em Chromium para páginas Viagens, Combate, Diário, NPCs e Campanhas. Viagens avaliada em 390, 720, 1024, 1100, 1280 e 1440 px, sem rolagem horizontal do documento e com a hierarquia de cores esperada.
- Visualizações foram testadas em ambiente simulado; a confirmação dos estados reais, permissões do Supabase e fluxos de confirmação depende do navegador e dos dados reais do projeto.
- Nenhuma alteração no banco de dados, Supabase, inventário da ficha, comandos de jogo ou arquivos da versão do Jogador.
