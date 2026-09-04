# Ajuste: Produtos dentro de Estoque

Nesta versão, a área de Produtos foi unificada ao Estoque.

## O que mudou

- O menu lateral não mostra mais a opção Produtos.
- A rota antiga `/produtos` redireciona automaticamente para `/estoque`.
- A tela Estoque agora usa a nomenclatura "Item / Produto".
- A busca foi ajustada para item/produto.
- A base continua a mesma: `stock_items` no Supabase.

## Por que

No sistema, produto e item de estoque são o mesmo cadastro. Manter duas telas separadas criava confusão e sensação de duplicidade.
