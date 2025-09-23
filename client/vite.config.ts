import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/negces/',
  // base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@images': path.resolve(__dirname, 'src/assets/'),
      '@': '/src'
    },
  },
})
