import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Optional. Set OMNI_VITE_CACHE when the project lives on a filesystem
  // that cannot rename node_modules/.vite (some network mounts).
  ...(process.env.OMNI_VITE_CACHE ? { cacheDir: process.env.OMNI_VITE_CACHE } : {}),
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    proxy: {
      '/ipc': { target: 'http://127.0.0.1:1234', ws: true, changeOrigin: true },
      '/ws/sidecar': { target: 'http://127.0.0.1:8001', ws: true, changeOrigin: true },
      '/ws/bus': {
        target: 'http://127.0.0.1:8765',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws\/bus/, '/'),
      },
    },
  },
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    include: ['react-grid-layout'],
  },
})
