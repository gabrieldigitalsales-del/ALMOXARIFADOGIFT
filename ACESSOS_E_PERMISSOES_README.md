# Acessos e permissões

Esta versão adiciona login por perfil:

## Administrador
- Usuário: `admin`
- Senha: `asd123`
- Acesso completo ao sistema.

## Funcionários do almoxarifado
- Usuário: `almoxarifado`
- Senha: `gift123`
- Acesso operacional, sem visualização de custos, valores, orçamentos, compras, ordens de produção, garantia, relatórios e configurações.

## O que foi bloqueado para almoxarifado
- Menu de Máquinas
- Montar Máquina
- BOM / Estrutura
- Compras
- Ordens de Produção
- Garantias / WhatsApp
- Relatórios
- Configurações

## O que foi ocultado em telas permitidas
- Custo médio
- Valor unitário
- Preço médio
- Valor total de estoque
- Custo de manutenção
- OP vinculada nas movimentações
- Sugestão de compra pelo estoque

## Observação importante
Este controle é feito no front-end do sistema atual. Para segurança forte de banco de dados, o ideal é evoluir depois para Supabase Auth + RLS, com permissões reais no servidor.
