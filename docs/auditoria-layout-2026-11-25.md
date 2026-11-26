# Auditoria de layout — Railroad Mestre

> Documento histórico. A retirada dos CSS obsoletos e a reorganização posterior estão registradas em `docs/RELATORIO_REFATORACAO.md`.

**Base analisada:** o arquivo `RailroadMestre.zip` recebido nesta conversa. A revisão preserva a aplicação, seus temas, o rodapé mobile e a rolagem independente dos painéis.

## Diagnóstico

Os espaçamentos desktop estavam espalhados entre diversos arquivos de correção. A folha efetivamente carregada por último era `espacamento-desktop-v2.css`. Sua margem lateral de aproximadamente 56 px em 1363 px de largura ainda deixava os cartões visualmente próximos dos limites, e os antigos ajustes permaneciam como arquivos desligados da interface.

## Ajustes

- Um único `padding` por página controla o respiro em cima, nas laterais e abaixo. Não foram acrescentadas margens aos cartões primários.
- O contêiner pai define o `gap` entre cartões e entre seções, impedindo a soma de espaçamentos entre dois cartões vizinhos.
- A folha `espacamento-desktop-v3.css` substitui a v2, com nome novo para evitar CSS obsoleto em cache.
- O catálogo de Mecânicas conserva os recuos internos menores, ajustados anteriormente.
- O layout mobile (até 900 px) não foi modificado.

## CSS obsoleto, removido da versão completa

Os seis primeiros arquivos não eram carregados por `index.html` nem por importações da árvore ativa de CSS. O sétimo era a folha carregada anteriormente e foi substituído pela versão v3:

1. `css/desktop-viewport.css`
2. `css/encaixe-desktop.css`
3. `css/espacamento-desktop.css`
4. `css/identidade-railroad.css`
5. `css/rolagem-colunas.css`
6. `css/viewport-cartoes.css`
7. `css/espacamento-desktop-v2.css` (substituído pela v3)

Não foram excluídos arquivos JavaScript ou imagens: há imports dinâmicos e seletores de temas que exigiriam rastreamento em execução antes de considerar esses recursos inutilizados.

## Métricas do layout CSS em pré-visualização

| 1363 × 768 px | Antes | Revisado |
|---|---:|---:|
| Margens laterais | 56 px | 83 px |
| Distância do cabeçalho | 60 px | 79 px |
| Margem inferior | 42 px | 64 px |
| Intervalo entre os dois cartões NPC | 30 px | 37 px |

As mesmas variáveis são utilizadas em Campanhas, Sessões, Fichas, NPCs, Combates, Viagens e Utilitários. Essas medições foram feitas com os HTML e CSS originais carregados em uma pré-visualização estática, não com a sessão autenticada no aplicativo.

## Testes

`npm run preparar:publicacao`: 195 testes aprovados, 6 ignorados porque os SQL do Supabase não estão incluídos no repositório, nenhuma falha. A versão mobile de 390 px manteve a geometria da pré-visualização anterior.

**Instalação do pacote de atualização:** copie seus arquivos na raiz do Mestre (pasta do `index.html`) e exclua os sete CSS obsoletos listados acima. Não exclua o seu diretório local `supabase/`; ele continua fora do GitHub conforme a configuração do projeto.
