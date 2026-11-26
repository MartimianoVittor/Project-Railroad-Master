# Ajustes de sessões, personalização e integridade dos participantes

## Interfaces

- **Gerenciar sessões:** linhas compactas em grade; informações e ações organizadas horizontalmente; botões ↑/↓ ficam desabilitados nos limites da lista; título completo disponível ao passar o mouse; largura adaptável com quebra dos botões em telas pequenas.
- **Prévia de personalização:** o botão de demonstração permanece separado; os retratos ficam lado a lado, com campo Nome e cartão interno na coluna adjacente nos desktops, reduzindo o espaço vertical ocioso; a prévia mantém o comportamento responsivo e não tem rolagem interna.

## Integridade da mesa

- A remoção confirmada de um NPC ou ficha de jogador retira apenas a referência correspondente de Combates e de todas as Viagens/Grupos.
- Ao acessar Combates ou Viagens, o aplicativo revalida as fontes no Supabase. A RPC dedicada de fichas aprovadas é autoritativa para remoções automáticas, quando disponível; a consulta antiga continua atendendo a exibição em instalações sem essa migração.
- Erros de rede **não** são interpretados como lista vazia: registros sem confirmação são conservados. Referências explicitamente removidas são lembradas na sessão, de modo que um estado antigo de combate/viagem não as restaure.
- Dados restantes (turno, iniciativa, progresso da viagem, recursos, condições, marcadores) permanecem intactos.
- Estados são preservados localmente e enviados ao serviço existente com revisão otimista. Conflitos continuam sujeitos ao mecanismo de bloqueio e retentativa; não há escrita direta nas fichas dos jogadores.

## Validação

No diretório raiz, no PowerShell do Windows:

```powershell
npm.cmd run validar
```

A aplicação não recebeu mudanças de banco de dados; os testes de SQL que dependem de migrações não distribuídas permanecem ignorados.

### Conferência visual e funcional sugerida

1. Abra **Sessões → Gerenciar** e verifique os botões em janelas largas e estreitas.
2. Abra **Conta → Personalização** e teste os temas com a prévia, em alturas normais e reduzidas.
3. Adicione um NPC aos Combates e a mais de um grupo em Viagens. Exclua-o na aba NPCs e confirme sua remoção das mesas preservando os demais participantes e progressos.
4. Retire uma ficha aprovada ou exclua o jogador da campanha; confirme que as referências foram removidas de Combates e Viagens.
5. Recarregue o navegador e teste novamente, incluindo o sincronizador Supabase.
