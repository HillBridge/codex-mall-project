export default defineNuxtConfig({
  compatibilityDate: '2026-07-23',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  ssr: true,
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'theme-color', content: '#111827' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [{ rel: 'icon', href: '/favicon.svg' }]
    }
  },
  runtimeConfig: {
    sessionSecret: '',
    apiBaseInternal: 'http://127.0.0.1:4000',
    public: {
      appName: 'Nuxt Pilot',
      apiBase: '/api',
      siteUrl: 'http://localhost:3000'
    }
  },
  routeRules: {
    '/': { swr: 120 },
    '/products': {
      ssr: true,
      headers: {
        'cache-control': 'no-store'
      }
    },
    '/products/**': { swr: 300 },
    '/account/**': { ssr: true },
    '/api/**': {
      cors: false,
      headers: {
        'cache-control': 'no-store'
      }
    }
  },
  imports: {
    scan: false
  },
  components: ['~/components'],
  experimental: {
    typedPages: true
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
