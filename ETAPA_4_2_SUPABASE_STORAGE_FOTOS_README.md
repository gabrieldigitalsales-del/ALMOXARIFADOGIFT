# Etapa 4.2 — Fotos no Supabase Storage

Ajustes aplicados:

- Criado bucket público: `giftx-almox-siqueira-2026-item-photos`.
- Adicionado SQL em `supabase/item_photos_bucket.sql`.
- O botão **Adicionar foto** agora envia a imagem para o Supabase Storage.
- O cadastro do item salva apenas `photoUrl` e `photoStoragePath` dentro do JSONB `data`.
- Limite de upload: 5 MB.
- Tipos permitidos: JPEG, PNG, WebP e GIF.
- Caso o Supabase não esteja configurado em ambiente local, o app ainda permite prévia local em base64 para teste.

No Vercel, confira se as variáveis existem:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

O SQL do bucket já foi executado no projeto Supabase conectado nesta entrega.
