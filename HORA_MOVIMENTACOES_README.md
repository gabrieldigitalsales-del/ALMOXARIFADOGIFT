# Hora exata nas movimentações

Agora toda nova movimentação salva:

- data
- hora exata no formato HH:MM:SS
- createdAt em ISO para rastreio técnico
- usuário
- tipo
- item
- quantidade
- motivo

A coluna Hora aparece tanto para o administrador quanto para o funcionário.

Observação: movimentações antigas feitas antes desta atualização não possuem o campo `time`, então podem aparecer com a hora vazia.
