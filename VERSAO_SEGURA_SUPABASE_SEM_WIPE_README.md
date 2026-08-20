# Versão segura contra apagar estoque no Supabase

Base usada:
ALMOXARIFADOGIFT-EMERGENCIA-estoque-funcionando.zip

Correção aplicada:
- A sincronização em massa foi bloqueada para:
  - stock
  - movements

Motivo:
- Essas tabelas não devem ser substituídas inteiras automaticamente.
- Agora o sistema não deve mais apagar estoque inteiro do Supabase por carregamento vazio da tela.

O que continua salvando:
- Cadastro/edição de item: upsert individual
- Movimentação: upsert individual do item e movimentação
- Exclusão de item: delete individual
- Registro de movimentações: insert/upsert individual

Importante:
- Use esta versão antes de testar novas alterações.
- Não use as versões de ajuste de estoque que vieram depois se seu banco apareceu vazio.
