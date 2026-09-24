import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api':      { target: 'http://192.168.0.162:9102', changeOrigin: true },
      '/files':    { target: 'http://192.168.0.162:9102', changeOrigin: true },
      '/download': { target: 'http://192.168.0.162:9102', changeOrigin: true },
      '/preview':  { target: 'http://192.168.0.162:9102', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
