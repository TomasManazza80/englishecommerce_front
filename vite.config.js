import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  base: '/' // Cambiado a absoluto para evitar errores de MIME type en rutas dinámicas (ej: /product/123)
})