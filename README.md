# Almoxarifado GIFT Excellence

Sistema web em React + Vite, publicado na Vercel e conectado ao Supabase existente da GIFT.

## Produção

URL principal:

`https://almoxarifadogift.vercel.app/`

O projeto usa somente recursos com prefixo:

`giftx_almox_siqueira_2026_`

Não crie outro projeto Supabase para este sistema.

## Acessos

- Administrador: acesso total
- Almoxarifado: estoque, movimentações e colaboradores
- Bruno: somente Garantias

As senhas simples continuam conforme definido para o sistema, mas a validação não fica mais no React. O login cria uma sessão temporária no Supabase e as permissões são verificadas no backend.

## Segurança atual

- tabelas operacionais sem CRUD direto pela anon key;
- leitura/gravação via RPCs autenticadas;
- fotos enviadas por Edge Function autenticada;
- tabelas antigas de backup com RLS e sem acesso anon/authenticated;
- snapshot privado criado antes do hardening;
- logout invalida a sessão no Supabase.

## Dados

O estoque atual é persistido no Supabase. Não execute scripts destrutivos de restauração no banco de produção.

O arquivo `supabase/schema.sql` é **somente para instalação do zero**. Ele contém `DROP TABLE` e não deve ser executado no banco de produção.

SQLs de restauração e arquivos históricos devem ser tratados como recuperação manual, nunca como migration normal.

## Backups

O sistema mantém:
- backup JSON manual;
- backup diário em nuvem;
- snapshot privado de segurança no Supabase antes das alterações estruturais.

## Fotos dos itens

Bucket:

`giftx-almox-siqueira-2026-item-photos`

A leitura das imagens é pública para exibição no sistema. Upload e exclusão passam pela Edge Function `giftx-almox-item-photo` e exigem sessão com permissão de Admin ou Almoxarifado.

## Desenvolvimento

```bash
npm install
npm run dev
```

Variáveis:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
```

A pasta `dist/` é gerada pelo build e não deve ser versionada.

## Vercel

- Node 20
- Build: `yarn build`
- Output: `dist`
- SPA rewrite para `index.html`

As dependências estão fixadas e o `package-lock.json` permanece versionado para referência do ambiente atual.
