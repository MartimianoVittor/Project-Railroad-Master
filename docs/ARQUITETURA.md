# Arquitetura — Railroad Mestre

## Finalidade e execução

O Escudo do Mestre é uma aplicação estática em JavaScript ES Modules, HTML e CSS, compatível com servidor HTTP simples e GitHub Pages. Não há etapa de compilação. O ponto de entrada é `index.html`, que carrega `js/mesa.js`. O módulo `js/core/carregarInterface.js` monta sete páginas de `views/pages/` e três diálogos de `views/dialogs/` antes de inicializar os controladores.

Execute `npm test` para verificar a aplicação. Antes de publicar, execute `npm run preparar:publicacao`; esse comando padroniza as URLs locais de CSS e JavaScript com `cacheVersion`, do `package.json`, e executa os testes. Em Windows/PowerShell, `npm.cmd run preparar:publicacao` evita bloqueios da política de scripts.

## Organização do código

| Pasta | Responsabilidade |
| --- | --- |
| `js/app/` | Estado compartilhado, sessão local/Google e troca de campanha |
| `js/controllers/` | Interação entre páginas e serviços (Diário, NPCs, combate, viagem etc.) |
| `js/modules/` | Modelos de dados, regras do jogo, exibição e componentes especializados |
| `js/services/` | Persistência em navegador e Supabase, sincronização e controle de revisão |
| `js/core/` | Cliente Supabase, DOM, carregamento de páginas e notificações |
| `views/pages/`, `views/dialogs/` | Estrutura da interface sem lógica de negócios |
| `css/`, `assets/` | Layout, estilos, materiais western e imagens |
| `supabase/` | Migrações SQL aplicadas em ordem numérica |
| `tests/` | Testes Node nativos, sem dependências externas |
| `scripts/` | Preparação repetível de arquivos para publicação |

## Armazenamento e sincronização

### Modo local

Campanhas, sessões, NPCs, combate e viagens mantêm cópias no armazenamento do navegador, separadas por conta e campanha. Armazenamento local **não** substitui backup exportado e não deve ser tratado como backup permanente.

### Supabase — migrações

As migrações `001.sql` a `011_preferencias_visuais_mestre.sql` devem estar instaladas antes da nova `012_integridade_conteudo_mestre.sql`. Essa última migração é **obrigatória para os novos serviços de Diário e NPCs online**. Se ela não tiver sido executada, a interface avisará quando as chamadas ao Supabase falharem; não existe fallback para a antiga sequência insegura de operações.

A migração 012 adiciona a revisão em `public.npcs`, cria `public.diarios_mestre` e expõe as RPCs:

- `ler_diario_mestre`: lê conteúdo e revisão no mesmo instante lógico do banco.
- `salvar_diario_mestre`: grava o conjunto de sessões, exclusões conhecidas e sessão ativa em uma transação, verificando a revisão.
- `salvar_npc_mestre`: cria/atualiza NPC com revisão otimista.
- `salvar_npcs_combate_mestre`: grava em uma única transação todos os NPCs do combate, ou nenhum em caso de erro.

As funções executam como usuário autenticado e dependem das políticas RLS e da verificação de propriedade da campanha criada nas migrações anteriores. Não é necessário reexecutar as migrações 001–011 em um projeto já atualizado; basta executar a 012.

**Atenção a clientes antigos:** sessões e NPCs ainda podem ser alterados por abas antigas que não utilizem as novas RPCs. Feche outras abas antigas e atualize todos os dispositivos antes de retomar uma campanha em modo online. O controle de revisão não repara alterações já sobrescritas anteriormente.

### Conflitos, erros e cópias locais

O Diário e os NPCs recusam gravações com revisão desatualizada. A edição permanece na interface até que o usuário decida como proceder; **não é feita mesclagem automática**. Em uma falha de carregamento dos NPCs online, a lista local permanece disponível apenas para consulta e o encerramento do combate com esses NPCs é bloqueado. O combate usa uma RPC transacional para transferir ferimentos/equipamentos aos NPCs.

O sincronizador de combate e viagens mantém a cópia local e mostra **Tentar sincronizar** quando ocorre falha. O botão consulta a revisão remota antes de reenviar: se houver conflito, o envio é recusado e a cópia local fica preservada. Em conflitos de revisão, a recuperação ainda depende de uma escolha manual; não há tela de mesclagem de dados.

O cliente não controla a atomicidade SQL por si só; essa propriedade depende da migração 012 instalada corretamente no servidor.

## Personalização visual

`css/tema/`, `assets/tema/` e os estilos em `css/personalizacao.css` mantêm os cartões, botões, molduras e fundos. Imagens padrão de retratos foram convertidas para WebP. Os arquivos PNG originais permanecem compatíveis com históricos antigos e podem ser removidos separadamente após conferência das referências.

## Segurança e limites

O frontend pode conter apenas a chave **pública** do Supabase. Não colocar chaves `service_role`, tokens privados ou dados pessoais em arquivos estáticos. As permissões de leitura de fichas de jogadores dependem das funções específicas de compartilhamento e das políticas RLS; a versão do Mestre nunca deve gravar diretamente os dados de fichas privadas de jogadores.

**Verificação em produção:** usar contas de dois mestres, tentar acesso cruzado a sessões, NPCs e estados operacionais e testar uma edição simultânea em duas abas. A auditoria local e os testes Node não são substitutos desses testes de banco.
