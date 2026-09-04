# Etapa 4.1 - Fotos por upload/câmera e remoção de Ferramentas

Alterações aplicadas:

1. Removida a tela Ferramentas do menu lateral.
2. A rota /ferramentas agora redireciona para /estoque.
3. O cadastro de item não mostra mais campos de status/responsável de ferramenta.
4. O campo Foto do item deixou de ser apenas URL.
5. Adicionado botão Galeria para escolher imagem do celular/computador.
6. Adicionado botão Câmera com capture=environment para abrir a câmera traseira no celular quando suportado.
7. Adicionada prévia da foto dentro do cadastro.
8. Adicionado botão Remover foto.
9. A tabela de estoque mostra miniatura da foto quando existir.
10. Mantidos QR Code, etiqueta de prateleira, localização física e anexos/referências.

Observação: a foto é salva no próprio cadastro do item como Data URL dentro do JSON. Para uso muito pesado com muitas fotos grandes, o próximo avanço recomendado é migrar essas imagens para Supabase Storage.
