import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get DEV API URL from environment (Vite uses VITE_ prefix)
// Supports both VITE_DEV_API_URL and VITE_SERVICE_REQUESTS_API_URL (legacy)
function getDevApiUrl(): string {
  const devUrl = process.env.VITE_DEV_API_URL || process.env.VITE_SERVICE_REQUESTS_API_URL;
  if (devUrl) {
    return devUrl.replace(/^["']|["']$/g, '').trim();
  }
  // Default to DEV environment (same as main app)
  return 'https://gw5cndev.geowise.ai';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: getDevApiUrl(),
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url, '→', getDevApiUrl())
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
