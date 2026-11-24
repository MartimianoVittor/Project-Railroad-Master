# Railroad RPG · Escudo do Mestre

O Escudo do Mestre reúne as sete abas usadas para narrar uma campanha de Railroad RPG. O mestre organiza jogadores e fichas em **Campanhas** e **Fichas**, registra sessões no **Diário**, cria **NPCs**, acompanha **Combate** e **Viagem** e monta painéis de consulta em **Utilitários**.

## Executar o projeto

Na pasta que contém `index.html`, abra o projeto com o **Live Server** do VS Code ou inicie um servidor estático com Python.

```sh
python -m http.server 8000
```

Com o servidor Python, abra [localhost na porta 8000](http://localhost:8000). Escolha **Usar local**, crie uma campanha e selecione-a. As abas carregam arquivos HTML e módulos JavaScript por HTTP. O projeto também pode ser servido em um subdiretório do GitHub Pages.

**Entrar com Google** usa o mesmo projeto Supabase do site Railroad Jogador. A URL e a chave pública de acesso ficam em `js/config/supabase.js`. Os convites e as fichas compartilhadas dependem dessa conexão. A estrutura do banco e a sequência de migrações estão no [guia de arquitetura](docs/ARQUITETURA.md).

## Atualização do Supabase (obrigatória para modo online)

A versão com controle de revisões e gravação transacional requer a migração
[`supabase/012_integridade_conteudo_mestre.sql`](supabase/012_integridade_conteudo_mestre.sql),
que deve ser aplicada após as migrações 001–011 no mesmo projeto Supabase do Jogador.
**Faça backup e execute a migração antes de publicar os arquivos novos**. Consulte
[as instruções do patch](README_PATCH.md) e o [roteiro de segurança](docs/SEGURANCA_SUPABASE.md).

## Preparar uma publicação

```sh
npm run preparar:publicacao
```

No Windows PowerShell, use `npm.cmd run preparar:publicacao` caso o `npm.ps1` esteja bloqueado.
O comando padroniza as versões de cache das URLs de CSS/JavaScript e executa os testes.
O número fica em `cacheVersion` do `package.json`; altere esse identificador antes da próxima publicação.

## Executar os testes

Na raiz do projeto, com Node.js e npm disponíveis, execute o comando abaixo. A suíte usa o executor nativo do Node e foi verificada com a versão 22.

```sh
npm test
```

Para executar apenas os testes do modelo de viagem, por exemplo, use `node --test tests/viagem-modelo.test.mjs`. O site e a suíte dispensam compilação e instalação de pacotes.

## Por onde começar uma alteração

| O que você quer editar | Onde começar |
| --- | --- |
| Campos, rótulos e estrutura de uma aba | Arquivo da aba em `views/pages/` |
| Resposta de uma aba a cliques e mudanças de campanha | Arquivo de mesmo nome em `js/controllers/` |
| Traços, marcadores e dados usados pelas fichas | `js/modules/ficha/campos.js` e `js/modules/rolagem.js` |
| Ritmo de viagem ou distância até o descanso | `js/modules/viagem/modelo.js` e `tests/viagem-modelo.test.mjs` |
| Botões, molduras e fundos western | `css/tema/` e `assets/tema/` |
| Leitura e gravação no navegador ou no Supabase | `js/services/` |

O [guia de arquitetura](docs/ARQUITETURA.md) descreve como essas partes se conectam e quais formatos precisam ser preservados para abrir campanhas já salvas.
