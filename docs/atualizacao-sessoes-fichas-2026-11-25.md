# Atualização do Railroad Mestre — sessões, fichas e barras

- **Sessões**: Quadro de Ideias removido da interface; Marcos e notas ocupa a largura. O campo `quadro` em dados anteriormente salvos é preservado para não provocar perda de histórico.
- **Listas de combate e viagem**: atualizam dados ao abrir os modais. A nova RPC `listar_personagens_aprovados_mestre` retorna IDs e nomes diretamente. Se o SQL ainda não foi executado, o código usa as consultas anteriores como alternativa.
- **Supabase**: mantenha o script SQL em separado do repositório, aplique a migração 020 no SQL Editor **após 019**. A migração cria funções, sem tocar nos registros. O SQL de diagnóstico é apenas leitura.
- **Barras**: Sessões, Fichas, NPCs, Utilitários e Viagens com 66 px no desktop (largura >900px); no mobile, a altura é adaptativa para comportar os controles.
- **NPCs**: o cabeçalho agora contém ações reais (criação e busca), movidas da lista, sem reservar faixa vazia.
- **Publicação**: atualizar os arquivos do ZIP incremental na raiz que contém `index.html`, preservar a pasta `.git` e recarregar com Ctrl+Shift+R.

## Conferência em campanha autenticada

1. Entre no Mestre e selecione a campanha correta.
2. Na aba Campanhas, confira se o convite foi aceito e a ficha aprovada.
3. Abra Combates > Adicionar e Viagens > Adicionar viajante. As duas listas consultam os dados da campanha novamente.
4. Se as fichas continuarem ausentes, use o SQL de diagnóstico (separado do repositório) e compare com os status da campanha. Sem acesso ao Supabase em produção não é possível validar o estado real dos registros.
