import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    configure(proxy) {
      // Sanctum is configured for localhost without Vite's port in this project.
      proxy.on('proxyReq', (proxyRequest, request) => {
        const origin = request.headers.origin
        if (origin) {
          const parsedOrigin = new URL(origin)
          proxyRequest.setHeader('Origin', `${parsedOrigin.protocol}//${parsedOrigin.hostname}`)
        }
        const referer = request.headers.referer
        if (referer) {
          const parsedReferer = new URL(referer)
          proxyRequest.setHeader(
            'Referer',
            `${parsedReferer.protocol}//${parsedReferer.hostname}${parsedReferer.pathname}${parsedReferer.search}`,
          )
        }
      })
    },
  }

  return {
    root: 'src',
    
    build: {
      outDir: '../dist',       
      emptyOutDir: true,
    },

    server: {
      proxy: {
        '/api': apiProxy,
        '/sanctum': apiProxy,
      },
    },
  }
})