# Verificações de segurança e integridade no Supabase

Estas verificações devem ser feitas **em ambiente de testes**, antes de atualizar o site de produção. Não utilize campanhas reais como massa de teste.

1. Faça um backup do banco e confirme quais migrações de `supabase/` já foram executadas.
2. Aplique `supabase/012_integridade_conteudo_mestre.sql` **após** a migração 011. O SQL não apaga sessões ou NPCs existentes. Execute no SQL Editor do seu projeto Supabase com a conta administrativa do projeto.
3. Confirme que a tabela `public.npcs` possui `revisao`, que `public.diarios_mestre` está protegida com RLS e que as quatro funções RPC novas aparecem no banco.
4. Entre como Mestre A e crie uma campanha de teste; crie uma sessão e um NPC; salve ambos. No modo local, a conexão com o banco não é utilizada.
5. Entre como Mestre B com outra conta e tente consultar/alterar os registros de campanha do Mestre A. Todas essas operações devem ser recusadas pelas políticas de segurança. Não utilize uma chave `service_role` nesses testes.
6. Abra a mesma campanha do Mestre A em duas abas. Carregue o mesmo NPC nas duas, salve alterações na primeira e tente salvar a versão antiga na segunda. A segunda operação deve ser recusada como conflito, sem sobrescrever a primeira.
7. Repita o cenário com sessões do Diário. O segundo salvamento deve ser recusado sem deixar a campanha sem sessão ativa nem apagar parcialmente outras sessões.
8. Coloque dois NPCs em combate. Simule uma edição concorrente de um deles em outra aba e tente encerrar. **Nenhum** dos dois NPCs deve receber parcialmente os dados do combate quando houver conflito; o combate deve permanecer aberto.
9. Interrompa a conexão durante a sincronização de combate ou viagens. A cópia local deve permanecer e o botão **Tentar sincronizar** deve aparecer. Reestabeleça a rede e confira o comportamento com e sem revisão remota alterada.
10. Repita os testes de leitura compartilhada de fichas dos jogadores, verificando que a RPC autorizada não expõe campos privados e que a interface não oferece gravação dessas fichas pelo Mestre.

## Ordem de implantação

**Primeiro:** backup e migração 012 no Supabase.

**Depois:** copie o ZIP de atualização sobre a versão do Mestre e execute `npm.cmd run preparar:publicacao` no Windows ou `npm run preparar:publicacao` em outros terminais.

**Por último:** revise `git status`, registre o commit, publique no GitHub Pages e recarregue as abas antigas. Verifique login Google, campanhas, sessões, NPCs, combate e viagens no domínio publicado.

Se a migração não for aplicada, **não publique** a atualização do frontend para uso online. Campanhas em modo local não exigem banco.
