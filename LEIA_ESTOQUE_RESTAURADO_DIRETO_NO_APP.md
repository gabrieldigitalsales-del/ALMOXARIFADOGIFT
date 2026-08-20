# Estoque restaurado direto no aplicativo

Este ZIP contém os 233 itens recuperados gravados diretamente dentro do aplicativo.

Arquivos principais:
- src/data/seed.js
  - stockSeed agora vem preenchido com os 233 itens.
- src/data/recoveryStock.js
  - cópia de recuperação automática dos 233 itens.
- supabase/restaurar_estoque_233_itens.sql
  - SQL para restaurar os 233 itens direto no Supabase.

Proteção:
- O aplicativo não faz mais replace geral da tabela stock.
- O aplicativo não faz mais replace geral da tabela movements.
- Alterações no estoque passam a ser feitas item por item.

Observação:
- Os valores unitários encontrados na cópia recuperada estavam zerados.
- Os nomes e quantidades dos 233 itens recuperados estão gravados no app.
