# Ajuste: backup diário sem download + câmera direta

## Backup diário
- O backup automático diário não baixa mais arquivo toda vez que o app entra.
- Agora ele salva um snapshot JSON na tabela Supabase:
  `giftx_almox_siqueira_2026_daily_backups`.
- O botão manual de backup JSON continua disponível nas Configurações.
- O botão "Salvar backup diário agora" força um backup em nuvem sem download.

## Foto do item
- A área de foto agora possui dois caminhos:
  - Galeria: escolher arquivo/imagem.
  - Tirar foto: usa `capture="environment"` para pedir a câmera traseira no celular.
- Em desktop, o navegador pode continuar abrindo seletor de arquivos; isso é comportamento do browser.

## SQL incluído
- `supabase/daily_backups_table.sql`
