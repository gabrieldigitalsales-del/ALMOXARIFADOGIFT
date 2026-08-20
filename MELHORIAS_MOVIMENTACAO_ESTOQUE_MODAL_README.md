# Melhorias de movimentação, estoque e janelas

Base usada: ALMOXARIFADOGIFT-devolucao-direta-colaborador.zip

Melhorias aplicadas:

1. Movimentações ordenadas por horário real
- Agora as listas usam createdAt/data/hora para mostrar primeiro as operações mais recentes.

2. Entrada e saída separadas visualmente
- Entrada, saída, voltou para o estoque, perda e outros tipos aparecem com etiquetas visuais diferentes.

3. Novo item no estoque aparece nas movimentações
- Ao cadastrar um item novo no estoque, o sistema registra uma movimentação automática:
  - Entrada, se tiver quantidade inicial maior que zero
  - Cadastro de item, se a quantidade inicial for zero

4. Adicionar item foca direto no Nome
- Ao clicar em Adicionar no estoque, o cursor já vai direto para o campo Nome.

5. Janelas fecham com ESC
- Modais podem ser fechados apertando ESC.

6. Confirmação antes de sair sem salvar
- Se a janela estiver marcada como edição em andamento, ao fechar pelo X, ESC ou fora da janela, aparece confirmação.

7. Movimentações com filtro no admin
- Busca por item, colaborador, tipo, data, usuário ou OP.
- Filtro por tipo: Todas, Entrada, Saída, Voltou para o estoque e Perda.

8. Histórico do item no estoque melhorado
- O histórico do item agora mostra hora e tipo visual.

9. Aba Colaboradores ordenada
- Históricos e movimentações recentes aparecem por horário real.

10. Devolução direta preservada
- Continua possível devolver ferramenta direto dentro do colaborador.
