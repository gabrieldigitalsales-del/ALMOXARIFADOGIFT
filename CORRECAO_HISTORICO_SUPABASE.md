# Correção do histórico no Supabase

Esta versão corrige o salvamento dos módulos integrados.

- Orçamentos: `giftx_almox_siqueira_2026_sales_quotes`
- Ordens de Serviço: `giftx_almox_siqueira_2026_service_orders`
- Cotações de Frete: `giftx_almox_siqueira_2026_freight_quotes`
- Transportadoras: `giftx_almox_siqueira_2026_carriers`
- Fornecedores: usa a tabela matriz `giftx_almox_siqueira_2026_suppliers`

Antes, Orçamentos e OS ainda mantinham o histórico no localStorage. Agora o histórico é carregado e salvo no Supabase.

## Publicação

1. Confirme que o SQL `GIFT_CONTROL_MIGRACAO_UNICA.sql` já foi executado no projeto Supabase da matriz.
2. Substitua os arquivos do repositório pelos desta versão.
3. Mantenha as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.
4. Faça novo deploy.
