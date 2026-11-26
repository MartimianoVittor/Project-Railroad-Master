# Relatório técnico — reorganização e endurecimento do Railroad Mestre

**Origem:** `RailroadMestre(1).zip`, fornecido pelo usuário.  
**Método:** análise de referências e dependências, alterações conservadoras, testes Node, inspeção de folhas CSS e tentativa de teste em Chromium.  
**Escopo:** frontend. A pasta Supabase não estava no ZIP e continua gerenciada separadamente.

## 1. Resultado

A aplicação mantém sua arquitetura de módulos ES e seus recursos funcionais. Foram
corrigidos defeitos concretos do processo de publicação e removidos arquivos sem
referências no frontend, evitando reescrever de uma vez as áreas críticas de dados.

**Verificação executada em 26/11/2026 (UTC):**

- `npm run preparar:publicacao`: **aprovado**.
- Testes Node: **215 no total, 209 aprovados, 0 falhas, 6 ignorados**. Os testes
  ignorados dependem de migrações SQL do Supabase que não estão na cópia recebida.
- Sintaxe: **66 módulos JavaScript/MJS aprovados** (módulos da aplicação e scripts).
- Referências: **284 referências locais resolvidas**, **52 folhas CSS alcançáveis** e
  **61 módulos JS no grafo de inicialização**; uma fachada de compatibilidade adicional
  (`js/modules/sessoes.js`) foi mantida propositalmente.
- `git fsck --no-reflogs`: executado sem erros informados.
- CSS: 52 folhas analisadas, sem erro sintático de nível superior detectado pelo analisador.
- Preparador executado duas vezes: **zero alterações na segunda execução**.

**Limitação:** o Chromium do ambiente bloqueou a visita ao servidor HTTP local com
`ERR_BLOCKED_BY_ADMINISTRATOR` tanto em desktop quanto no viewport mobile. Portanto,
não há homologação visual ou funcional de ponta a ponta no navegador, nem testes
com contas/Supabase neste pacote. Testes estáticos não comprovam contraste em todos
os temas ou fluxos remotos.

## 2. Melhorias implementadas

### Integridade e publicação

- Versionamento das URLs locais (`?v=`) unificado em `mesa-44` conforme o
  `package.json`; removidos os identificadores conflitantes `condicoes-2` e
  `scrollbars-2` da página principal.
- Refatorado `scripts/preparar-publicacao.mjs` para utilizar funções puras em
  `scripts/lib/versionamento.mjs`: versões antigas arbitrárias são corrigidas,
  referências externas permanecem intactas e novas execuções são idempotentes.
- Criados os comandos `npm run verificar:recursos`, `npm run verificar:sintaxe` e
  `npm run validar`; a preparação para publicação agora executa toda a validação.
- Acrescentados testes para versionamento, idempotência e recursos locais.
- Verificação de recursos inspeciona importações JS/CSS, URLs de recursos CSS e
  atributos HTML, respeitando caminhos de fragments montados na página principal.
  Também informa CSS não carregado e JS não importado, com exceção explícita para
  a API de compatibilidade de sessões.

### Estilos e organização

- Ajustes específicos da consulta de Combates movidos de
  `css/ajustes-consulta-mesa44.css` para `css/combate/ajustes-consulta.css`.
  **A posição de carregamento no índice foi preservada** para não alterar a cascata.
- Estilos da janela Adicionar condição concentrados em
  `css/combate/modal-condicoes.css`, com regras sobrescritas consolidadas.
- Folha de barras personalizadas mantida por último entre os estilos para aplicar
  tokens visuais do usuário sem mudar as regiões com rolagem oculta deliberadamente.
- Entrada JS posicionada após as referências das folhas CSS no `head`.

### Arquivos removidos após rastreamento estático

Sete folhas CSS que não eram carregadas:

- `css/desktop-viewport.css`
- `css/encaixe-desktop.css`
- `css/espacamento-desktop.css`
- `css/espacamento-desktop-v2.css`
- `css/identidade-railroad.css`
- `css/viewport-cartoes.css`
- `css/rolagem-colunas.css`

Outros seis arquivos sem referências na aplicação:

- `js/modules/visualizarNpc.js` (renderizador anterior, sem importações)
- `assets/imgs/imagemJogadorPlaceholder.png` (WebP utilizado pelo aplicativo)
- `assets/imgs/imagemPersonagemPlaceholder.png` (WebP utilizado pelo aplicativo)
- `assets/tema/cartucho-12.svg`
- `assets/tema/faca-bowie.svg`
- `assets/tema/faca-bowie-ativa.svg`

Os estilos para **botões** Cartucho 12 e Faca Bowie foram **mantidos**: somente os
SVGs externos não usados foram removidos. Os componentes continuam a desenhar seus
elementos pela própria folha `css/tema/botoes.css`.

### Documentação

- `README.md` ganhou instruções de verificação.
- `docs/ARQUITETURA.md` descreve os comandos, módulos e recursos atuais.
- `docs/GUIA_DESENVOLVIMENTO.md` define regras de organização, CSS, testes,
  compatibilidade, acessibilidade e revisão antes da publicação.

## 3. Preservado por precaução

- Estrutura existente de telas, funções de domínio, dados locais e integração Supabase.
- `js/modules/sessoes.js`, que ainda é importante para testes e consumidores antigos.
- CSS de tema com seletores usados dinamicamente, que não podem ser removidos por
  um grep simples; não foi executada uma redução automática de classes CSS.
- Pasta `.git`, para uso com GitHub Desktop e recuperação de versões anteriores.
- Migrações Supabase externas ao ZIP. Não foram alteradas nem reconstruídas.

## 4. Dívida técnica restante

A refatoração priorizou **baixo risco**. Algumas folhas grandes, especialmente
`css/personalizacao.css`, `css/npc-jogador-integral.css` e o conjunto de ajustes
históricos da consulta de combate, continuam com regras redundantes ou
`!important`. Fundi-las automaticamente sem inspecionar os estados de interface
poderia alterar as prioridades da cascata e introduzir regressões. Recomenda-se
consolidação incremental, por componente, com regressões visuais após cada mudança.

Também permanecem necessários os testes em ambiente real dos fluxos de
compartilhamento de fichas, sincronização, autenticação e políticas RLS.

## 5. Instruções de adoção

1. Faça uma cópia de segurança da pasta local do Railroad Mestre, incluindo `.git`.
2. Use a pasta completa deste ZIP **como a nova cópia do projeto**. Evite apenas
   extrair por cima da pasta anterior: isso deixaria os 13 arquivos obsoletos no disco.
3. **Não apague a pasta `supabase/` local**, caso exista: ela não faz parte deste ZIP,
   conforme a configuração de versionamento original.
4. Confira as alterações no GitHub Desktop e registre um commit após aprovação.
5. Rode `npm run preparar:publicacao` e teste com Live Server, em desktop e mobile.
6. No modo online, valide integração e permissões do Supabase com ambiente de teste.

**Observação sobre Git:** o ZIP recebido já trazia alterações locais ainda não
registradas no histórico. O pacote preserva esse estado, além desta reorganização.
Não foi criado um commit automaticamente em nome do usuário.
