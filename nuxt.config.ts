// 安全头配置在构建期读取：`nuxt dev` 为开发，`nuxt build` 为生产
const isDevelopment = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-23',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint', 'nuxt-security'],
  security: {
    // SSR 下为每个请求生成 nonce，并自动注入到 SSR 输出的 <script>/<style>/<link>
    nonce: true,
    // 保持关闭：CSRF 由 server/middleware/02-api-guard.ts 的双重 cookie 方案负责
    csrf: false,
    // 项目的 logger（server/utils/logger.ts）依赖 console.log，不能在构建时被移除
    removeLoggers: false,
    // 以下中间件是 nuxt-security 默认开启的，不属于本次迁移范围，且会改变现有行为：
    // xssValidator 会拒绝包含 HTML 片段的 GET/POST 参数（例如带 < 的密码），
    // rateLimiter / requestSizeLimiter / corsHandler 需要单独评估后再启用。
    xssValidator: false,
    rateLimiter: false,
    requestSizeLimiter: false,
    corsHandler: false,
    headers: {
      contentSecurityPolicy: {
        // 未单独声明的资源类型回退到同源
        'default-src': ["'self'"],
        // 生产不再使用 unsafe-inline：
        // - nonce 放行 SSR 输出的内联脚本和入口脚本
        // - strict-dynamic 允许入口脚本动态加载的子脚本（hydration、路由 chunk）
        // - 'self' 仅作为不支持 strict-dynamic 的旧浏览器回退
        // 开发环境额外放开 unsafe-eval，兼容 Vite/Nuxt DevTools
        'script-src': [
          "'self'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
          ...(isDevelopment ? ["'unsafe-eval'"] : [])
        ],
        // Nuxt hydration 与 Vue 的 style 绑定依赖内联样式，样式层面保留 unsafe-inline（官方推荐）
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
        'font-src': ["'self'", 'data:'],
        // 开发环境放开 http/https/ws/wss 以支持本地后端和 HMR
        'connect-src': isDevelopment ? ["'self'", 'http:', 'https:', 'ws:', 'wss:'] : ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        // 本地开发走 http，开启后会把子资源强行升级为 https
        'upgrade-insecure-requests': !isDevelopment
      },
      // 与迁移前保持一致的头
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      xFrameOptions: 'DENY',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      // 迁移前没有 COEP，且会影响跨域图片（Unsplash）的加载，保持关闭
      crossOriginEmbedderPolicy: false,
      // nuxt-security 默认还会禁用 fullscreen 和 display-capture，这里恢复为浏览器默认（同源可用）
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        fullscreen: ['self'],
        'display-capture': ['self']
      },
      // HSTS 只在生产启用，与迁移前一致
      strictTransportSecurity: isDevelopment
        ? false
        : { maxAge: 31536000, includeSubdomains: true, preload: true }
    }
  },
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
    upstreamServiceId: process.env.BFF_SERVICE_ID || 'nuxt-bff',
    upstreamServiceToken: process.env.BFF_SERVICE_TOKEN || '',
    upstreamServiceSignatureSecret: process.env.BFF_SERVICE_SIGNATURE_SECRET || '',
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
    typedPages: true,
    emitRouteChunkError: 'automatic'
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
