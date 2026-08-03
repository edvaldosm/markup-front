import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: parseInt(process.env.PORT ?? '5173'),
    // O backend autoriza origens de CORS por lista explícita (5173/4173). Com
    // `strictPort: false` o Vite migra em silêncio para a 5174 quando a porta
    // está ocupada, e aí toda chamada morre no preflight, com um erro de
    // navegador que não aponta para a causa. Falhar no start é mais barato.
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
