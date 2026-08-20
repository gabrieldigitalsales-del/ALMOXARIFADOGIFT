# SQL corrigido

Use este arquivo:

supabase/restaurar_estoque_233_itens_SEGURO_CORRIGIDO.sql

Correção:
- O SQL antigo quebrava quando o nome do item tinha aspas, exemplo: 1.1/4" #3/16.
- Este SQL novo usa jsonb_build_object, então não quebra com aspas ou # no nome do item.
- O SQL faz upsert por ID e não apaga a tabela inteira.
