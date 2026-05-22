# Almoxarifado GIFT Excellence

Sistema WEB em React + Vite, preparado para deploy na Vercel e banco de dados Supabase.

## Login

Senha única do sistema:

```txt
asd123
```

## Estado inicial

O sistema vem zerado:

- Sem itens no estoque
- Sem máquinas cadastradas
- Sem fornecedores cadastrados
- Sem compras cadastradas
- Sem movimentações cadastradas
- Sem ordens de produção cadastradas

As categorias, subcategorias e setores já ficam pré-definidos no código para facilitar o cadastro manual.

## Rodar localmente

```bash
npm install
npm run dev
```

## Rodar na rede interna

```bash
npm run dev -- --host 0.0.0.0
```

Depois acesse pelo IP mostrado no terminal, por exemplo:

```txt
http://192.168.0.100:5173/
```

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo:

```txt
supabase/schema.sql
```

As tabelas usam nomes únicos com o prefixo:

```txt
giftx_almox_siqueira_2026_
```

Isso evita conflito com tabelas de outros projetos no mesmo banco.

## Variáveis de ambiente

Copie `.env.example` para `.env` em desenvolvimento local:

```bash
cp .env.example .env
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

No Vercel, cadastre essas mesmas variáveis em:

```txt
Project Settings > Environment Variables
```

## Deploy na Vercel

Configuração já incluída em `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Comandos:

```bash
npm install
npm run build
```

Depois envie o projeto para o GitHub e importe na Vercel.

## Observação de segurança

O sistema mantém a senha simples `asd123`, conforme solicitado. As políticas do Supabase liberam CRUD com a anon key para facilitar o uso interno. Para uso público ou multiusuário, o ideal é trocar por autenticação Supabase Auth e políticas por usuário.
