# Ajuste: Estoque mínimo em branco

Alteração aplicada no cadastro de item do estoque:

- O campo `Estoque mínimo` agora pode ficar vazio.
- Ao apagar o valor, ele não volta para 0 automaticamente.
- Ao salvar com o campo vazio, o sistema mantém o campo em branco.
- O status do item só considera `Estoque baixo` quando existe um estoque mínimo preenchido.

Arquivos alterados:
- `src/components/FormGrid.jsx`
- `src/pages/Stock.jsx`
- `src/context/AppContext.jsx`
- `src/utils/costs.js`
