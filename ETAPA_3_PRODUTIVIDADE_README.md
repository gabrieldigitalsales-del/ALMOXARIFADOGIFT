# ETAPA 3 — PRODUTIVIDADE

Nesta etapa foram adicionadas funções para acelerar o uso diário do almoxarifado sem executar ações destrutivas.

## O que entrou

1. Nova tela **Produtividade** no menu lateral.
2. Exportação rápida do estoque completo em Excel.
3. Exportação rápida do estoque completo em CSV.
4. Exportação da lista de compra por estoque mínimo.
5. Exportação de custo por máquina.
6. Importador de estoque por Excel/CSV.
7. Importação segura: atualiza existentes e adiciona novos sem apagar nada.
8. Modo de importação **somente novos**.
9. Backup automático antes da importação.
10. Prévia de importação antes de aplicar.
11. Leitura inteligente de colunas como nome, item, produto, descrição, código, quantidade, unidade, valor unitário e mínimo.
12. Classificação automática para itens importados sem categoria.
13. Painel de indicadores rápidos: total de itens, abaixo do mínimo, sem valor, sem mínimo, máquinas e vínculos quebrados.
14. Tela de compras por estoque mínimo com busca e quantidade sugerida para compra.
15. Botão para gerar sugestões de compra em lote para itens críticos.

## Segurança

- A importação não apaga registros.
- Antes de importar, o app baixa um backup JSON.
- A importação atualiza por código; se não encontrar código, tenta pelo nome.
- A tela fica protegida para administrador.
