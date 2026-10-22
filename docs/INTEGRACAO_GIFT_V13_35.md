# Integração GIFT V13.35 — plano de implantação
Fonte: GIFT-COMPRAS-ALMOXARIFADO-V13-35-LIMPEZA-AVISOS(1).zip.
Esta branch é de integração. NÃO substituir main até concluir os testes de compra, estoque, devolução, anexos e permissões.

## Banco já preparado
Seis tabelas com prefixo giftx_almox_siqueira_2026_:
- sales_quotes
- service_orders
- freight_quotes
- carriers
- module_settings
- audit_logs

RLS desativado somente nessas seis tabelas a pedido do responsável.
As permissões SQL anon/authenticated seguem revogadas: o front-end ainda não possui acesso direto.
Não executar supabase/schema.sql, restaurar_estoque_original_233_itens.sql ou outros scripts de recuperação como migração.

## Próximas entregas de código
1. Comparar integralmente o ZIP V13.35 com a base main, preservando rotas e funções já operantes.
2. Adaptar módulos novos e serviços aos nomes de tabelas prefixados e às RPCs existentes.
3. Persistir compras, aprovações e recebimentos sem sobrescrever estoque.
4. Avaliar armazenamento de anexos e o serviço gift-extractor.js separado do frontend Vite.
5. Rodar build e testes em preview sem promover para produção.
6. Auditar mudanças em dados, permissões e design antes de release.

## Proteção da produção
Não modificar tabelas antigas, não importar CSV de reposição de estoque e não promover branch automaticamente.
