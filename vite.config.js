import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
  define: {
    'import.meta.env.VITE_GEMINI_KEY': JSON.stringify(process.env.VITE_GEMINI_KEY)
  }
})