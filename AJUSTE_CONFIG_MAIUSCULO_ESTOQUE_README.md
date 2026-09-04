# Ajuste aplicado - Padronizar nomes em maiúsculo

Foi adicionada em **Configurações** a opção:

**Padronizar nomes em maiúsculo**

O botão chama a função SQL `giftx_almox_siqueira_2026_uppercase_stock_names()` no Supabase.

## O que a função faz

1. Cria uma tabela de backup antes da alteração, com nome no padrão:
   `giftx_almox_siqueira_2026_stock_items_backup_maiusculo_YYYYMMDD_HHMMSS`
2. Atualiza somente o campo `data->>'name'` da tabela de estoque.
3. Mantém códigos, quantidades, valores, categorias e movimentações intactos.
4. Recarrega o estoque na tela após concluir.

## SQL incluído

O arquivo está em:

`supabase/uppercase_stock_names_function.sql`

A função também já foi criada no projeto Supabase conectado durante este ajuste.
