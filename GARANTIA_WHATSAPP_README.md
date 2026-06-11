# Adicional: Garantia + WhatsApp automático

Este pacote adiciona ao sistema uma tela chamada **Garantias / WhatsApp** sem trocar os nomes das tabelas existentes e sem apagar o banco atual.

## O que foi adicionado

- Tela para cadastrar cliente, WhatsApp, máquina, OP, data de entrega, prazo de garantia e mensagem.
- Garantia padrão de **6 meses**.
- Aviso padrão **7 dias antes** do fim da garantia.
- Botão manual para abrir WhatsApp com a mensagem pronta.
- Tabela nova no Supabase: `giftx_almox_siqueira_2026_warranty_reminders`.
- Edge Function `warranty-whatsapp-reminder` para disparo automático via WhatsApp.

## Ordem segura de instalação

1. Faça backup do banco pelo Supabase antes de qualquer alteração.
2. No Supabase > SQL Editor, rode apenas o arquivo:
   `supabase/add_warranty_whatsapp.sql`
3. Atualize o projeto com este código e configure as variáveis `.env` do front:

```env
VITE_SUPABASE_URL=URL_DO_SEU_PROJETO
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

4. Para automação real do WhatsApp, publique a Edge Function:

```bash
supabase functions deploy warranty-whatsapp-reminder
```

5. Configure as secrets da função.

### Opção Z-API

```bash
supabase secrets set WHATSAPP_PROVIDER=ZAPI
supabase secrets set ZAPI_INSTANCE_ID=seu_instance_id
supabase secrets set ZAPI_TOKEN=seu_token
supabase secrets set ZAPI_CLIENT_TOKEN=seu_client_token_opcional
supabase secrets set CRON_SECRET=uma_senha_forte
```

### Opção Twilio

```bash
supabase secrets set WHATSAPP_PROVIDER=TWILIO
supabase secrets set TWILIO_ACCOUNT_SID=seu_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=seu_auth_token
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
supabase secrets set CRON_SECRET=uma_senha_forte
```

## Agendamento

A função precisa ser chamada 1 vez por dia. Você pode usar:

- Supabase cron/scheduled functions, se disponível no seu plano/projeto.
- GitHub Actions.
- Cron-job.org.
- Vercel Cron chamando a URL da função.

Chamada HTTP esperada:

```bash
curl -X POST 'https://SEU_PROJETO.supabase.co/functions/v1/warranty-whatsapp-reminder' \
  -H 'x-cron-secret: uma_senha_forte'
```

## Observação importante

O navegador não deve guardar token de WhatsApp, Twilio ou Z-API. Por isso, o disparo automático fica na Edge Function do Supabase, não dentro do React.

## Atualização solicitada

- Corrigida a geração da mensagem para usar o nome completo do cliente cadastrado. Exemplo: `Olá, Carlos! ...`.
- Se algum registro antigo ficou salvo com `Olá, S?`, a tela e a Edge Function regeneram a mensagem automaticamente usando o cliente do cadastro.
- No formulário, o campo de garantia agora é uma seleção fixa com as opções: 3 meses, 6 meses e 12 meses.
- Ao informar ou alterar a data de entrega, a garantia escolhida ou os dias de aviso, o sistema calcula automaticamente:
  - data final da garantia;
  - data do aviso.
- Foi adicionado o botão `Regerar mensagem com nome do cliente` dentro do formulário.
