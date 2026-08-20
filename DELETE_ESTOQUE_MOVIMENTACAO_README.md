# Exclusão de item aparece em movimentações

Alteração aplicada:

- Ao deletar um item do estoque, o sistema registra automaticamente uma movimentação:
  - Tipo: Item removido
  - Item: nome do item removido
  - Quantidade: estoque atual do item no momento da exclusão
  - Motivo: Item deletado do estoque
  - Data/hora e usuário são registrados automaticamente.

Base usada:
ALMOXARIFADOGIFT-notificacao-sem-modal-salvar-enter.zip
