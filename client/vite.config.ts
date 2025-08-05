import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@images': path.resolve(__dirname, 'src/assets/'),
      // You can add more aliases here
    },
  },
})
