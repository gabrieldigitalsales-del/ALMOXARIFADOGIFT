# Deploy na Vercel

Este projeto foi ajustado para evitar os erros de instalação do npm/pnpm na Vercel.

Configuração usada:

- Node.js: 20.x
- Package manager: Yarn 1.22.22 via Corepack
- Install Command: `corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --non-interactive --network-timeout 100000 --ignore-engines`
- Build Command: `yarn build`
- Output Directory: `dist`

Se a Vercel ainda tentar usar npm ou pnpm, vá em:

Project Settings > Build & Development Settings

E coloque manualmente:

Install Command:
`corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --non-interactive --network-timeout 100000 --ignore-engines`

Build Command:
`yarn build`

Output Directory:
`dist`

Node.js Version:
`20.x`
