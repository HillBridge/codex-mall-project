import { defineEventHandler, setHeader } from 'h3'

const isDevelopment = process.env.NODE_ENV !== 'production'

function createContentSecurityPolicy() {
  const directives = [
    // 默认只允许加载同源资源，其他未单独声明的资源类型都会继承这个限制。
    "default-src 'self'",
    // 限制脚本来源，生产只允许同源脚本；开发环境放开 inline/eval 以兼容 Nuxt/Vite 调试能力。
    isDevelopment ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
    // 限制样式来源，生产只允许同源样式；开发环境允许 inline style 以兼容热更新和框架注入样式。
    isDevelopment ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    // 限制图片来源：同源、data/blob 预览，以及当前项目使用的 Unsplash 图片域名。
    "img-src 'self' data: blob: https://images.unsplash.com",
    // 限制字体来源：同源字体和 data URL 字体，避免页面加载未知第三方字体资源。
    "font-src 'self' data:",
    // 限制接口/WebSocket 连接来源；开发环境放开 http/https/ws/wss 以支持本地后端和 HMR。
    isDevelopment ? "connect-src 'self' http: https: ws: wss:" : "connect-src 'self'",
    // 禁止 Flash、插件、embed/object 等老式可执行对象资源。
    "object-src 'none'",
    // 禁止页面被任何站点 iframe 嵌入，降低点击劫持风险。
    "frame-ancestors 'none'",
    // 限制 base 标签只能指向同源，防止攻击者篡改相对链接解析基准。
    "base-uri 'self'",
    // 限制表单只能提交到同源地址，降低表单跨站提交和数据外泄风险。
    "form-action 'self'"
  ]

  if (!isDevelopment) {
    // 生产环境把页面内 http 子资源自动升级为 https，减少混合内容风险。
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

export default defineEventHandler((event) => {
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'referrer-policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'permissions-policy', 'camera=(), microphone=(), geolocation=()')
  setHeader(event, 'x-frame-options', 'DENY')
  setHeader(event, 'cross-origin-opener-policy', 'same-origin')
  setHeader(event, 'cross-origin-resource-policy', 'same-origin')

  if (!isDevelopment) {
    setHeader(event, 'strict-transport-security', 'max-age=31536000; includeSubDomains; preload')
  }

  setHeader(event, 'content-security-policy', createContentSecurityPolicy())
})
