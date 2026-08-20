# RECUPERAÇÃO DO ESTOQUE

Este ZIP contém recuperação automática do estoque original com 233 itens.

Como funciona:
- Ao abrir o sistema conectado ao Supabase, se a tabela de estoque tiver menos de 200 itens, o sistema usa o arquivo src/data/recoveryStock.js para repopular o Supabase.
- A restauração é feita item por item com upsertCollectionItem.
- O replace geral do estoque foi bloqueado para evitar apagar tudo novamente.

Arquivos incluídos:
- src/data/recoveryStock.js
- Supabase_Snippet_Almoxarifado_gift_estoque_original_233.csv
- restaurar_estoque_original_233_itens.sql

Importante:
- Use somente este ZIP agora.
- Depois de abrir o sistema, aguarde alguns segundos/minutos para terminar a restauração.
- Atualize a página e confira o total de itens.
