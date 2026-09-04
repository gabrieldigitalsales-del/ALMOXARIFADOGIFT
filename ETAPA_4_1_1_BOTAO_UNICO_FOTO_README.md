# Ajuste Etapa 4.1.1 — Botão único de foto

Alteração aplicada no cadastro de item:

- Removidos os botões separados **Galeria** e **Câmera**.
- Adicionado um único botão: **Adicionar foto**.
- No celular, o navegador/sistema operacional pode oferecer câmera, galeria ou arquivos.
- Mantido o botão **Remover foto** quando já existir imagem no cadastro.
- Mantida a miniatura da foto na tabela do estoque.

Motivo: os dois botões usavam `input type=file`; o comportamento de câmera/galeria varia por navegador e aparelho. Um botão único deixa o fluxo mais limpo e menos confuso.
