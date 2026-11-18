# Railroad — Escudo do Mestre v0.9.1

Aplicação independente do **Railroad Jogador**, com a mesma identidade visual de pergaminho, couro e dourado. Os dois projetos usam **o mesmo Supabase** e a autenticação Google já configurada.

## Correção da tela de entrada — v0.9.1

- A página inicial volta a permitir **rolagem vertical no desktop** quando não há sessão autenticada. Assim, o botão **Entrar com Google** e o aviso de entrada não ficam inacessíveis por causa da altura do monitor ou do zoom do navegador.
- O cartaz foi compactado em desktops para caber melhor na tela sem alterar a identidade visual.
- **Depois do login**, as abas continuam ocupando a altura disponível e os conteúdos excedentes usam rolagem interna, como nas versões anteriores.
- A correção não altera o banco de dados, as campanhas, as fichas nem os NPCs salvos no navegador. Não é necessário executar SQL.

## Aba Campanhas — v0.4.0

- A marca no cabeçalho passa a ser **RAILROAD · ESCUDO DO MESTRE**, sem a estrela.
- A frase abaixo de **Campanhas** é **Crie sua primeira campanha** quando não há campanhas; caso contrário, **Selecione uma campanha**.
- O quadro esquerdo contém primeiro **Nome da campanha**, **Descrição da campanha** e o botão **Criar campanha**, alinhado à direita. Embaixo, a lista de campanhas, cada uma com seu botão **Selecionar**.
- O quadro direito mostra a campanha selecionada e os jogadores convidados, com **nome do jogador**, **nome do personagem** e situação da entrada.
- Quando uma ficha está pendente, o Mestre pode usar **Aceitar entrada** ou **Negar entrada**. Quando pelo menos um personagem já foi aprovado, **Excluir da mesa** remove o jogador e todos os envios da campanha, **sem apagar suas fichas pessoais**.
- **Adicionar jogador**, no canto inferior direito, abre o campo de convite por código UUID.
- Um jogador pode enviar mais de um personagem; eles aparecem agrupados sob o mesmo nome de jogador.

**Fluxo de autorização:** o Mestre convida um jogador pelo código UUID; o jogador aceita o convite e envia uma ficha pelo Railroad Jogador; só então o Mestre pode aceitar ou negar a entrada da ficha. Convites ainda pendentes não podem ser aceitos pelo Mestre em nome do jogador.

## Ajustes em Campanhas — v0.8.1

- O botão **Atualizar** voltou ao lado do título e da descrição da campanha selecionada. Ele **recarrega as informações da campanha, os jogadores e os personagens do Supabase**; não edita o nome nem a descrição.
- A coluna de campanhas foi estreitada para dar mais espaço horizontal à lista de jogadores e personagens.
- Cada jogador e seus personagens são apresentados lado a lado em linhas compactas. **Aceitar entrada** e **Negar entrada** ficam ao lado do personagem pendente; **Convite aceito** fica abaixo do nome do jogador, e **Excluir da mesa** fica alinhado à direita, abaixo do personagem. O botão também fica disponível quando o convite já foi aceito e ainda não há personagem aprovado.
- Em telas pequenas, as informações são empilhadas para evitar cortes. Em desktops, listas longas continuam com rolagem interna.
- Não houve mudança no banco, nas RPCs ou nos dados locais. **Não é necessário executar SQL novo.**

## Nova aba NPCs — v0.9.0

- Uma **sétima aba**, **NPCs**, aparece na barra superior, entre Fichas e Combate.
- Selecione uma campanha para consultar seus NPCs. A lista à esquerda permite **buscar pelo nome, apelido ou função** e selecionar uma ficha.
- **+ Criar NPC** abre o editor com dois tipos: **Simplificada** e **Completa**.
- A ficha **simplificada** contém nome, função, descrição, traço principal (nível 0–4), ferimentos e notas do mestre.
- A ficha **completa** contém nome, apelido, função, descrição, profissões, línguas, fama, palavra, dinheiro, os **12 traços**, as **quatro condições** (ferimentos, sede, fome e cansaço), duas armas com munição e bônus por distância, inventário e notas do mestre.
- Depois de salvar, a ficha aparece em modo **consulta**, com ações **Editar** e **Excluir**. As fichas são apresentadas sem permitir alterações acidentais na consulta.
- O editor avisa antes de descartar alterações não salvas ao trocar de NPC, campanha ou aba. O botão **Salvar** da barra superior também salva uma ficha de NPC que esteja sendo editada.
- **Persistência:** os NPCs ficam no `localStorage` **deste navegador**, separados por conta e campanha. Eles não aparecem no Railroad Jogador e não são enviados ao Supabase. Para encontrá-los depois, use a mesma origem (domínio e porta) do site e o mesmo navegador. Para sincronização entre dispositivos, será necessária uma migração futura.
- **Nenhum SQL novo** é necessário para a v0.9.0.

## Aba Diário — v0.7.0

- As abas não repetem títulos grandes. Em Campanhas, o aviso continua sendo **Crie sua primeira campanha** ou **Selecione uma campanha**.
- Em Diário, o seletor de sessões fica à esquerda e os botões **Adicionar sessão**, **Salvar** e **Gerenciar** ficam à direita. Os rótulos redundantes acima da área de trabalho foram removidos.
- O espaço é dividido em **40% para Marcos e notas** e **60% para o Quadro de ideias**.
- Marcos e notas: campo de escrita com botão **Limpar**.
- Quadro de ideias: o título fica **na mesma linha das ferramentas**, liberando mais espaço para o quadro. **Lápis, Borracha, Texto, Imagem, Mover, Cor e Limpar** seguem as ferramentas do Railroad Jogador. É possível desenhar, inserir imagens (inclusive arrastando ou colando), movimentar e redimensionar textos/imagens.
- **Adicionar sessão** abre uma janela para informar o **nome** (até 80 caracteres) e uma **descrição breve** (até 25 caracteres).
- Sessões numeradas: **Sessão 01, Sessão 02...**. A numeração é calculada pela ordem atual e muda imediatamente ao arrastar ou mover com as setas.
- **Gerenciar** apresenta o número, nome e descrição de cada sessão, além de **Editar**, **Duplicar**, **Excluir**, **↑** e **↓**.
- Os cabeçalhos introdutórios antes dos quadros foram removidos em todas as abas. As instruções contextuais de Campanhas e Diário ficam integradas aos respectivos quadros.
- O botão **Salvar** na barra superior e o botão **Salvar** da aba Diário gravam as sessões da campanha selecionada **neste navegador**, separadas por conta Google e campanha.
- As alterações não são gravadas automaticamente: **clique em Salvar**. Ao trocar de sessão, o conteúdo não salvo permanece em memória até você salvar ou fechar a página. Ao trocar de campanha ou sair, o sistema avisa sobre alterações pendentes.
- O rascunho de texto da v0.4.0 é importado automaticamente na primeira sessão, se ainda não houver sessões v0.5.0. O texto anterior de ideias é preservado nas notas dessa sessão.

**Layout:** em desktops com espaço suficiente, cada aba ocupa a altura da janela sem rolagem da página. Listas extensas e campos de texto podem ter **rolagem interna** para não esconder dados. Em telas menores, a página volta a permitir rolagem por acessibilidade.

## Aba Fichas — v0.8.0

- Um **seletor de personagem à esquerda** mostra as fichas enviadas à campanha, ainda pendentes ou já aprovadas. Fichas recusadas não aparecem.
- Selecionar um personagem abre **três colunas verticais** lado a lado: **Jogador**, **Personagem** e **Inventário**, cada uma ocupando um terço da área disponível no desktop.
- Os botões **Jogadores**, **Personagens** e **Inventários**, à direita, exibem a parte correspondente de **todos os personagens compartilhados**, lado a lado, para comparação. Com mais de três personagens, deslize horizontalmente **dentro do quadro**.
- A página fica fixa na altura disponível, inclusive no celular. Conteúdos longos rolam **dentro de cada coluna** e comparações extensas rolam **dentro do quadro**.
- Os dados são **somente leitura**: o Mestre não edita as fichas. Aprovação, recusa e exclusão da mesa continuam na aba **Campanhas**.
- O **quadro de ideias do jogador é privado**. A migração SQL 006 retira a política que permitia ao Mestre ler o JSON integral da ficha e disponibiliza uma RPC que retorna apenas dados de Jogador, Personagem e Inventário.

**Atenção:** a aba Fichas v0.8.0 depende de `supabase/006_fichas_leitura_privada.sql`. Sem executar a migração no mesmo Supabase do Jogador, a nova consulta de fichas não funcionará. Execute somente o SQL 006 se já instalou 004 e 005.

## Demais áreas

| Área | Situação |
| --- | --- |
| **Campanhas** | Criação, seleção, convites e gestão de jogadores |
| **Fichas** | Consulta individual em três colunas e comparação horizontal por parte; sem quadro privado |
| **Combate** | Estrutura visual e personagens aprovados; lógica completa virá depois |
| **Viagem** | Estrutura visual; mecânicas virão depois |
| **Utilitários** | Referências iniciais de dados, modificadores e dificuldades |

## Instalação e migrações

**Atualizando da v0.8.1:** extraia o ZIP de atualização v0.9.0 sobre a pasta do Mestre. Preserve `.git` e `js/config/supabase.js`. O pacote inclui todas as sete páginas e os dois diálogos. Confira `ATUALIZAR_DE_V0.8.1.md`. Se ainda não instalou a v0.8.0, siga também `ATUALIZAR_DE_V0.7.0.md` e aplique a migração SQL 006.

**Banco:** execute **somente `supabase/006_fichas_leitura_privada.sql`** no mesmo Supabase compartilhado com o Jogador, após backup. As migrações 004 e 005 já instaladas não devem ser repetidas. A migração 006 não exclui dados: restringe a leitura integral pelo Mestre e cria a nova RPC. A versão antiga do Mestre deixa de consultar fichas após essa migração; instale a v0.8.0 antes de testar.

**Versões anteriores à v0.7.0:** aplique as atualizações intermediárias em ordem ou use o projeto completo v0.9.0 preservando sua configuração Supabase e o mesmo endereço do Live Server.

As sessões do Diário ficam **somente no armazenamento local deste navegador**. Não há sincronização do Diário com o Supabase nesta versão. Imagens grandes podem atingir o limite de armazenamento local; o aplicativo informa quando não consegue salvar. Mantenha a mesma origem (protocolo, domínio e porta) do Live Server para continuar acessando as sessões anteriores.

## Publicação e autenticação

- A configuração pública fica em `js/config/supabase.js` (URL e chave publishable/anon).
- Mantenha o domínio do Mestre autorizado em **Supabase → Authentication → URL Configuration → Redirect URLs**.
- Use um repositório GitHub separado do Railroad Jogador e publique com GitHub Pages, se desejar.
- O login Google do Mestre deve retornar à URL do próprio site Mestre.

## Estrutura modular (v0.9.0)

```text
RailroadMestre/
├── index.html                  # Casca da aplicação (cabeçalho e login)
├── views/
│   ├── pages/                 # Campanhas, Diário, Fichas, NPCs, Combate, Viagem, Utilitários
│   └── dialogs/               # Criar e gerenciar sessões
├── css/
│   ├── base.css               # Identidade visual e barra superior
│   ├── mesa.css               # Ponto de entrada para os CSS especializados
│   ├── layout.css             # Estrutura e elementos compartilhados
│   ├── campanhas.css
│   ├── diario.css
│   ├── fichas.css
│   ├── npcs.css
│   ├── ferramentas.css        # Combate, Viagem, Utilitários
│   ├── sessoes.css            # Diálogos de gerenciamento
│   └── responsivo.css         # Ajustes desktop, tablet e celular
├── js/
│   ├── mesa.js                # Inicialização, autenticação e eventos
│   ├── app/estado.js          # Estado compartilhado da mesa
│   ├── controllers/
│   │   ├── campanhas.js       # Campanhas, convites e participantes
│   │   ├── diario.js          # Sessões, edição e salvamento local
│   │   └── fichas.js          # Seleção, comparação e consultas de fichas
│   ├── core/
│   │   ├── carregarInterface.js # Carregamento dos fragmentos HTML
│   │   ├── dom.js             # Funções auxiliares de interface
│   │   ├── cliente.js         # Cliente Supabase e autenticação
│   │   └── feedback.js        # Mensagens e tratamento de erros
│   ├── modules/               # Quadro, sessões, navegação, leitura e modelo de NPCs
│   ├── services/campanhas.js  # RPCs do Supabase
│   ├── services/npcsLocal.js  # Armazenamento local privado dos NPCs
│   └── config/supabase.js     # URL e chave pública do Supabase
├── supabase/                  # Migrações 004, 005 e nova 006
├── tests/                     # Testes automatizados
└── docs/ARQUITETURA.md
```

As páginas são carregadas de `views/pages/` antes de iniciar os controladores. **É necessário usar Live Server ou outro servidor HTTP**; abrir `index.html` com `file://` não carrega os fragmentos. Os caminhos são relativos e funcionam também no GitHub Pages.

Não alteramos o formato das sessões no `localStorage` nem a configuração do Supabase. A nova RPC de leitura exige o SQL 006. Para manter os rascunhos, continue abrindo o site **na mesma origem** (mesmo domínio, protocolo e porta).

## Testes

```bash
npm test
```

Os testes automatizados verificam os serviços, a estrutura da interface, o agrupamento dos personagens e as regras de acesso descritas no SQL. É necessário testar separadamente as permissões no **Supabase real**, com duas contas diferentes.
