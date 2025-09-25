import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on current mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_CONFIG || '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    resolve: {
      alias: {
        '@images': path.resolve(__dirname, 'src/assets/'),
        '@': '/src',
      },
    },
  }
})
