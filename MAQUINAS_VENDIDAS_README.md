# Adicional - Máquinas Vendidas

Este adicional cria uma área no sistema para registrar máquinas vendidas por número de série, sem precisar manter planilha externa.

## O que foi adicionado

- Nova aba no menu: **Máquinas Vendidas**.
- Seleção da máquina já cadastrada no sistema.
- Campo para digitar o número de série.
- Campo opcional para vincular uma OP.
- Cliente puxado automaticamente do cadastro da máquina quando existir.
- Histórico na mesma tela com busca por série, cliente, máquina ou OP.
- Backup JSON agora inclui `soldMachines`.

## SQL necessário

Antes de usar no Supabase, rode apenas este arquivo:

```txt
supabase/add_sold_machines.sql
```

Esse SQL **não apaga nada** e **não altera as tabelas antigas**. Ele só cria a tabela:

```txt
giftx_almox_siqueira_2026_sold_machines
```

Não rode o `schema.sql` completo se o banco já está em uso, porque o `schema.sql` é de instalação limpa e apaga/recria tabelas.

## Como usar

1. Entre no sistema.
2. Abra a aba **Máquinas Vendidas**.
3. Se quiser, selecione a OP vinculada.
4. Selecione a máquina.
5. Digite o número de série.
6. Confirme a data de venda/entrega.
7. Clique em **Salvar no histórico**.

O número de série não pode ser repetido dentro do histórico.
