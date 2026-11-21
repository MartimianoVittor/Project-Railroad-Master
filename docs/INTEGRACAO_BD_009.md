# Railroad Mestre — atualização 20

## Instalação

1. Na raiz do **Railroad Mestre**, extraia o pacote ZIP da atualização 20. O pacote contém apenas arquivos criados ou modificados, com caminhos relativos preservados.
2. No **mesmo projeto Supabase** usado por Mestre e Jogador, confirme que as migrações `001` a `008` já foram aplicadas (inclusive a correção `008` de RLS).
3. No **SQL Editor** do Supabase, execute integralmente `supabase/009_estados_mestre.sql`, uma única vez. Não é necessário executar essa migração no projeto do Jogador.
4. Atualize o navegador com `Ctrl + F5`, entre com Google, selecione a campanha e acesse **Viagens** ou **Combate**.
5. Os estados existentes no navegador serão enviados ao Supabase caso o respectivo estado ainda não exista no banco. Se houver dados na nuvem e modificações locais não sincronizadas, o aplicativo pede uma decisão antes de sobrescrevê-los.

> Sem executar a migração SQL, a aplicação continua utilizando as cópias locais desses módulos e mostra um aviso de falha de sincronização. Não considere os dados sincronizados até aplicar a migração e confirmar o funcionamento no seu Supabase.

## Auditoria do armazenamento

| Área do Mestre | Armazenamento remoto | Observações |
|---|---|---|
| Campanhas, convites e personagens enviados | Supabase (RPCs e RLS existentes) | A ficha do Jogador continua sendo propriedade do Jogador |
| NPCs | Supabase (migrações 007/008) | A consulta de munição passa a salvar também na nuvem; finalizar combate atualiza os NPCs no banco |
| Sessões, notas e quadro | Supabase (migrações 007/008) | Já integrados anteriormente; permanece a cópia local |
| Viagens e grupos | **Supabase (migração 009)** | Todas as viagens, grupos, membros, progresso, ritmos, recursos e marcações ficam no JSON da campanha |
| Combate | **Supabase (migração 009)** | Combatentes, turnos, iniciativa, armas, condições e ferimentos são preservados. Imagens de fichas não são duplicadas no JSON; são buscadas na ficha/NPC original |
| Fichas privadas dos jogadores | Leitura autorizada pelo Supabase | O Mestre **não** pode gravar diretamente nas fichas do Jogador. Marcadores de viagem e combate permanecem estados da campanha; não alteram a ficha original |
| Modo local | Navegador | O banco não é utilizado quando o usuário escolhe trabalhar offline |

## Segurança e consistência

- `estados_mestre` armazena **um documento por campanha e área** (`viagens` ou `combate`), protegido por RLS e pelo proprietário da campanha.
- A RPC `salvar_estado_mestre` exige a revisão correta. Se outra aba alterar o registro, a gravação é rejeitada; a cópia local permanece e o aplicativo avisa.
- Escritas são agrupadas com pequeno atraso para evitar uma operação de rede por clique. Antes de fechar a página, verifique se as atualizações conseguiram sincronizar.
- Dados de terceiros nunca são transferidos para uma campanha diferente.
- Cópias locais pré-sincronização são mantidas no navegador sob `railroad-mestre:backup-pre-nuvem:...` quando uma versão remota diferente precisa ser carregada.
- Não insira a **service role key** no JavaScript ou no site. Utilize somente a chave pública do cliente, com autenticação e políticas RLS.

## Padrão de botões

O tema comum está centralizado em `css/botoes-railroad.css`, seguindo as cores já usadas no Railroad Jogador:

- **Marrom** (`.rr-botao-marrom`): confirmar, salvar, rolar, avançar/realizar ações.
- **Amarelo** (`.rr-botao-amarelo`): criar, adicionar, sortear ou iniciar.
- **Vermelho** (`.rr-botao-vermelho`): excluir, remover, encerrar e limpar dados.
- **Bege** (`.rr-botao-bege`): fechar, cancelar, editar e ações auxiliares.

Novos botões do Mestre devem usar `class="botao rr-botao-[cor]"`. Botões já existentes foram classificados por seletores sem alterar o comportamento de seus eventos JavaScript. Esta atualização **não altera os arquivos da versão do Jogador**.

## Limites

A implementação foi testada com um cliente Supabase simulado e em navegadores locais. A autenticação real e a execução SQL no banco do usuário precisam ser verificadas após instalar. Não há sincronização automática **em tempo real** entre duas abas abertas: a revisão impede substituição silenciosa, e a reabertura permite decidir qual versão manter.
