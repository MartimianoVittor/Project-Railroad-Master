# Railroad Mestre — correções da auditoria (patch)

Este ZIP contém **somente arquivos novos/modificados** em relação a `RailroadMestre(7).zip`, com caminhos relativos originais. Não inclui a pasta `.git/`. Não elimina automaticamente arquivos existentes.

## O que foi corrigido

1. **Diário:** uma única operação transacional no Supabase para salvar sessões, ordem, exclusões conhecidas e sessão ativa. Conflitos entre abas são recusados por revisão.
2. **NPCs:** revisão otimista para gravação/exclusão; falha ao carregar o banco deixa a cópia local apenas para consulta, sem esvaziar a lista.
3. **Encerramento de combate:** verifica que todos os NPCs combatentes estão disponíveis e grava todos em **uma única transação**; se algum falhar, nenhum NPC é alterado e o combate permanece.
4. **Combate e viagens:** botão **Tentar sincronizar** aparece em caso de falha; antes de reenviar, verifica se a revisão do servidor continua igual à revisão conhecida. Alterações realizadas durante um envio não são descartadas.
5. **Imagens:** retratos padrão otimizados como WebP; mesmos tamanhos de imagem, URLs locais atualizadas. PNGs antigos não são apagados por este patch.
6. **Publicação:** `cacheVersion` único `mesa-31`, script repetível de preparação e GitHub Actions para testes.
7. **Documentação e testes:** novos testes de concorrência e falhas, guia de arquitetura e roteiro de verificação real no Supabase.

## Procedimento obrigatório para quem usa Supabase

**Não publique o novo código antes da atualização do banco.**

1. Faça backup do banco do seu projeto Supabase.
2. No **SQL Editor** do mesmo projeto onde já estão as migrações 001–011, execute o conteúdo de `supabase/012_integridade_conteudo_mestre.sql`.
3. Confira se não houve erro. As funções novas dependem das políticas de acesso das migrações 007–011. Se qualquer etapa falhar, **não atualize o frontend**.
4. Extraia este ZIP na **raiz do Railroad Mestre**, preservando a estrutura e substituindo os arquivos indicados. Não misture com o projeto do Jogador.
5. No terminal do VS Code, na pasta que contém `package.json`, execute:

   ```powershell
   npm.cmd run preparar:publicacao
   ```

   O comando sincroniza URLs do cache e executa todos os testes. Para rodar apenas testes, use `npm.cmd test`.
6. Execute `git status`, confira modificações e arquivos novos e faça commit/push pelo seu fluxo normal.
7. Atualize todas as abas abertas do Mestre (`Ctrl+F5`) e teste os fluxos indicados em `docs/SEGURANCA_SUPABASE.md`.

**Sem migração:** a versão nova ainda funciona em **modo local**, mas salvar/listar Diário e NPCs em contas online dependerá das RPCs novas e retornará erro até o banco ser atualizado. Nenhum fallback inseguro foi adicionado.

## Limitações que continuam exigindo verificação

- Os testes Node são locais; não foi feita alteração ou validação direta do seu Supabase.
- Não foi executado o fluxo visual completo em navegador com login Google no site publicado.
- A resolução de conflitos permanece manual: os dados não são mesclados automaticamente.
- Alterações feitas em versões antigas do site, ainda abertas em outras abas, podem ignorar o novo controle de revisão. Feche as abas antigas antes de voltar a editar.
- O banco deve ser testado com duas contas separadas para confirmar que as políticas RLS estão corretas.

## Arquivos removidos

Nenhum. Os dois PNGs antigos dos retratos padrão permanecerão no seu projeto por compatibilidade, embora a interface passe a usar WebP. **A remoção deles é opcional**, após confirmar que nenhum outro repositório ou página usa as URLs antigas.
