import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    configure(proxy) {
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
    root: process.cwd(),
    
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(process.cwd(), 'index.html'),
          login: resolve(process.cwd(), 'pages/login.html'),
          register: resolve(process.cwd(), 'pages/register.html'),
          products: resolve(process.cwd(), 'pages/products.html'),
          product: resolve(process.cwd(), 'pages/product.html'),
          cart: resolve(process.cwd(), 'pages/cart.html'),
          checkout: resolve(process.cwd(), 'pages/checkout.html'),
          orders: resolve(process.cwd(), 'pages/orders.html'),
          order: resolve(process.cwd(), 'pages/order.html'),
          profile: resolve(process.cwd(), 'pages/profile.html'),
          admin: resolve(process.cwd(), 'pages/admin.html'),
          notFound: resolve(process.cwd(), 'pages/404.html'),
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