import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'

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
      rollupOptions: {
        input: {
          index: resolve(process.cwd(), 'src/index.html'),
          login: resolve(process.cwd(), 'src/pages/login.html'),
          register: resolve(process.cwd(), 'src/pages/register.html'),
          products: resolve(process.cwd(), 'src/pages/products.html'),
          product: resolve(process.cwd(), 'src/pages/product.html'),
          cart: resolve(process.cwd(), 'src/pages/cart.html'),
          checkout: resolve(process.cwd(), 'src/pages/checkout.html'),
          orders: resolve(process.cwd(), 'src/pages/orders.html'),
          order: resolve(process.cwd(), 'src/pages/order.html'),
          profile: resolve(process.cwd(), 'src/pages/profile.html'),
          admin: resolve(process.cwd(), 'src/pages/admin.html'),
          notFound: resolve(process.cwd(), 'src/pages/404.html'),
        },
      },
    },

    server: {
      proxy: {
        '/api': apiProxy,
        '/sanctum': apiProxy,
      },
    },
  }
})