# Atualização automática das movimentações

Foi adicionada atualização automática para estoque e movimentações.

Agora, quando um funcionário registra uma movimentação em outro login/computador, o administrador não precisa atualizar a página manualmente. O sistema consulta o Supabase automaticamente a cada 3 segundos e atualiza:

- movimentações
- estoque

Observação: isso depende do Supabase estar configurado nas variáveis de ambiente do sistema.
