// Supabase Edge Function: warranty-whatsapp-reminder
// Dispara avisos de garantia via WhatsApp para registros vencendo no prazo.
// Suporta Z-API ou Twilio por variaveis de ambiente.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const TABLE = 'giftx_almox_siqueira_2026_warranty_reminders';
const today = () => new Date().toISOString().slice(0, 10);
const onlyDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

function getCustomerName(row: Record<string, any>) {
  return String(row.customerName || row.customer_name || row.clientName || row.cliente || '').trim();
}

function getMachineName(row: Record<string, any>) {
  return String(row.machineName || row.machine_name || row.machine || row.maquina || '').trim();
}

function defaultMessage(row: Record<string, any>) {
  const customer = getCustomerName(row) || 'tudo bem';
  const machine = getMachineName(row);
  const serial = String(row.serialNumber || row.serial_number || '').trim();
  const machineText = machine ? ` da máquina ${machine}${serial ? ` / série ${serial}` : ''}` : ' da sua máquina';
  return `Olá, ${customer}! Aqui é da GIFT Excellence. Passando para avisar que a garantia${machineText} está próxima do fim. Caso precise de suporte, estamos à disposição.`;
}

function isAutoMessage(message: unknown, row: Record<string, any>) {
  return !message || message === defaultMessage(row) || String(message).includes('Olá, S?');
}

async function sendWithZapi(phone: string, message: string) {
  const instanceId = Deno.env.get('ZAPI_INSTANCE_ID');
  const token = Deno.env.get('ZAPI_TOKEN');
  const clientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
  if (!instanceId || !token) throw new Error('Z-API não configurada: informe ZAPI_INSTANCE_ID e ZAPI_TOKEN.');

  const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(clientToken ? { 'Client-Token': clientToken } : {})
    },
    body: JSON.stringify({ phone, message })
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Erro Z-API ${res.status}: ${body}`);
  return body;
}

async function sendWithTwilio(phone: string, message: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM');
  if (!accountSid || !authToken || !from) throw new Error('Twilio não configurado: informe TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM.');

  const auth = btoa(`${accountSid}:${authToken}`);
  const form = new URLSearchParams();
  form.set('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`);
  form.set('To', `whatsapp:+${onlyDigits(phone)}`);
  form.set('Body', message);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Erro Twilio ${res.status}: ${body}`);
  return body;
}

async function sendWhatsApp(row: Record<string, any>) {
  const provider = (Deno.env.get('WHATSAPP_PROVIDER') || row.provider || 'ZAPI').toUpperCase();
  const phone = onlyDigits(row.customerPhone);
  const message = isAutoMessage(row.message, row) ? defaultMessage(row) : row.message;
  if (!phone) throw new Error('Registro sem telefone do cliente.');
  if (provider.includes('TWILIO')) return sendWithTwilio(phone, message);
  return sendWithZapi(phone, message);
}

serve(async req => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const limit = Number(Deno.env.get('REMINDER_BATCH_LIMIT') || 25);
    const { data, error } = await supabase
      .from(TABLE)
      .select('id,data,created_at')
      .lte('data->>reminderDate', today())
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;

    const dueItems = (data || []).filter(item => {
      const row = item.data || {};
      return !row.reminderSentAt && row.status !== 'Cancelada';
    });

    const results: Array<Record<string, unknown>> = [];
    for (const item of dueItems) {
      const row = item.data || {};
      try {
        await sendWhatsApp(row);
        const updated = { ...row, status: 'Mensagem enviada', reminderSentAt: new Date().toISOString(), lastReminderError: null };
        const { error: updateError } = await supabase.from(TABLE).update({ data: updated }).eq('id', item.id);
        if (updateError) throw updateError;
        results.push({ id: item.id, ok: true, customerName: row.customerName });
      } catch (err) {
        const updated = { ...row, lastReminderError: String(err?.message || err), lastReminderAttemptAt: new Date().toISOString() };
        await supabase.from(TABLE).update({ data: updated }).eq('id', item.id);
        results.push({ id: item.id, ok: false, customerName: row.customerName, error: String(err?.message || err) });
      }
    }

    return new Response(JSON.stringify({ ok: true, date: today(), processed: results.length, results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
