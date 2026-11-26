# Desenvolvimento e manutenção — Railroad Mestre

## Princípios

O projeto é uma aplicação estática baseada em módulos ES. Evoluir por partes pequenas,
com testes e preservação de compatibilidade, é preferível a adicionar folhas transitórias
ou alterar a arquitetura inteira para resolver um problema isolado.

1. **Uma responsabilidade por módulo:** controladores coordenam interface e serviços;
   serviços acessam dados; módulos de domínio contêm regras, apresentação e cálculos especializados.
2. **Compatibilidade de dados:** preservar o formato de dados locais, versões históricas e
   comportamentos de recuperação; migrações de armazenamento devem vir com testes.
3. **CSS por componente:** colocar ajustes da página junto de seus componentes em `css/`.
   Evitar novas folhas chamadas `ajustes-v2`, `correcao-final` etc. e novas regras `!important`
   quando uma seletividade bem definida resolve o problema.
4. **Personalização primeiro:** textos, superfícies, bordas e barras roláveis devem usar os
   tokens `--rr-leitura-*`; verificar tema padrão e alternativos, inclusive contraste.
5. **Acessibilidade e responsividade:** controles com rótulos, navegação por teclado e
   layouts testados em desktop e celular. Evitar ocultar rolagem quando ela for necessária.
6. **Segurança de conteúdo:** dados externos não devem ser interpolados como HTML executável.
   Não publicar chaves privadas nem migrações/arquivos de ambiente em GitHub Pages.
7. **Revisões pequenas:** preferir mudanças com escopo claro, testes de regressão e nomes
   descritivos. Não retirar módulos de compatibilidade somente por ausência no grafo da interface.

## Organização

- `index.html`: ponto de entrada, CSS na ordem de precedência e `js/mesa.js`.
- `views/pages/`, `views/dialogs/`: estrutura HTML, sem chamadas diretas ao banco.
- `js/controllers/`: interação com páginas; `js/modules/`: componentes/regras;
  `js/services/`: persistência local e online; `js/core/`: ferramentas compartilhadas.
- `css/combate/`: estilo dos componentes de combate, inclusive janela de condições.
- `css/tema/` e `css/personalizacao.css`: temas visuais e sua pré-visualização.
- `css/rolagens-personalizadas.css`: scrollbar controlada por tokens e exceções intencionais.
- `tests/`: testes Node; `scripts/`: validações e publicação.

## Comandos

```bash
npm test                        # suíte de testes
npm run verificar:recursos      # links, importações e CSS/JS sem uso na inicialização
npm run verificar:sintaxe       # valida a sintaxe de módulos JS
npm run validar                 # executa os três passos anteriores
npm run preparar:publicacao     # normaliza cacheVersion e executa toda a validação
```

`preparar:publicacao` altera os fontes **somente se** as versões estiverem divergentes;
rodadas subsequentes devem registrar zero alterações. A versão de cache fica
exclusivamente em `package.json`, propriedade `cacheVersion`. Não usar versões
independentes como `condicoes-2` e `scrollbars-2`.

## Checklist antes de integrar/publicar

- Registrar um ponto estável no Git; nunca remover a pasta `.git` ao atualizar a cópia.
- Alterar os menores arquivos possíveis e verificar referências de caminhos após renomear.
- Rodar `npm run preparar:publicacao` e verificar que testes e recursos passam.
- Conferir alterações no GitHub Desktop, inclusive exclusões de arquivos legados.
- Abrir com Live Server e testar Campanhas, Sessões, Fichas, NPCs, Combates,
  Viagens, Utilitários e Personalização, em desktop e celular.
- Testar abertura/fechamento de diálogos, criação de condição e rolagem de traço;
  confirmar barra de rolagem e cores em temas diferentes.
- Validar modo online usando contas e banco de teste: a suíte local **não** substitui
  testes de RLS, compartilhamentos e migrações SQL.

## Decisões de compatibilidade

`js/modules/sessoes.js` permanece como fachada antiga, embora não faça parte do caminho
principal da aplicação; testes e possíveis consumidores externos dependem dessa API.
As migrações Supabase são gerenciadas fora deste pacote, conforme `.gitignore`.
