import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      // Keep MuPDF.js external. index.html pins the browser module through an
      // import map, which also makes direct GitHub Pages branch deployment work.
      external: ['mupdf'],
    },
  },
})
