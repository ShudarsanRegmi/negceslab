import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  preview: {
    port: 5173,
    host: true
  },
  resolve: {
    alias: {
      '@images': path.resolve(__dirname, 'src/assets/'),
      '@': '/src'
      // You can add more aliases here
    },
  },
})
