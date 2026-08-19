# Colaboradores com ferramentas

Atualização criada:

- O campo Motivo virou Colaborador nas movimentações.
- Lista fixa de colaboradores:
  - Vinicius
  - Luciano
  - Bruno
  - Gabriel
  - Sidney
  - Hanyel
  - Robson
  - Julia
  - Carla

## Lógica

Quando registrar uma SAÍDA com o nome do colaborador:
- o estoque baixa normalmente
- o item aparece no card da pessoa na aba Colaboradores

Quando registrar VOLTOU PARA O ESTOQUE com o nome do colaborador:
- o estoque soma normalmente
- a quantidade é reduzida do card da pessoa

A nova aba Colaboradores calcula tudo com base no histórico de movimentações.
Não foi criada tabela nova no Supabase.
