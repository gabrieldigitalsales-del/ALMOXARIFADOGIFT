# Ajuste de Zoom 90%

Aplicado ajuste global para o aplicativo abrir visualmente em 90%, reduzindo estouro de bordas e melhorando a leitura geral.

Arquivo alterado:

- `src/index.css`

Ajuste aplicado:

```css
html {
  zoom: 0.9;
}

@supports not (zoom: 1) {
  #root {
    transform: scale(0.9);
    transform-origin: top left;
    width: 111.111%;
    min-height: 111.111vh;
  }
}
```

Observação: o ajuste é visual e não altera dados do Supabase.
