# nuxt-security 配置逐行解读

本文解读 `nuxt.config.ts` 中与安全相关的配置：`isDevelopment` 常量、`modules` 里的 `nuxt-security`，以及整个 `security` 字段。

相关背景：

- 模块版本固定为 `nuxt-security@2.5.1`。`2.6.0` 要求 Node `>=24`，而项目 `engines` 是 `>=20.19`，所以没有使用。
- 迁移前，安全头由手写的 `server/middleware/01-security-headers.ts` 设置，现在已删除，改由 `nuxt-security` 负责。
- 项目自己的 CSRF 校验在 `server/middleware/02-api-guard.ts`，不受这次迁移影响。

## 1. 环境开关

```ts
const isDevelopment = process.env.NODE_ENV !== 'production'
```

- 判断当前是不是开发环境，后面用它在开发和生产之间切换部分策略。
- 这个值在配置加载时就确定了。`nuxt dev` 时为开发，`nuxt build` 时为生产。
- `nuxt-security` 在构建期读取配置并写入运行时配置，所以生产环境以构建时的 `NODE_ENV` 为准。构建产物上线后，再改运行时的 `NODE_ENV` 不会改变安全头。

## 2. 注册模块

```ts
modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint', 'nuxt-security'],
```

- 在 `modules` 末尾加入 `nuxt-security`，模块才会生效，`security` 字段也才有类型提示。
- 模块会注册一组 Nitro 插件。它们在 SSR 渲染 HTML 时注入 nonce，并设置响应头。
- 模块还会注册若干服务端中间件，比如限流、请求体大小限制、CORS、XSS 校验。默认全部开启，下面几项会显式关闭其中一部分。

## 3. 顶层开关

```ts
security: {
```

`security` 是模块的配置入口。下面分两部分：顶层开关，以及 `headers`（各个响应头）。

### nonce

```ts
nonce: true,
```

- 开启后，SSR 的每个请求都会生成一个随机 nonce。
- 模块会把这个 nonce 自动加到 HTML 里所有的 `<script>`、`<style>`、`<link>` 标签上。
- 同时，CSP 里写的 `'nonce-{{nonce}}'` 占位符会被替换成本次请求的真实值。
- 浏览器只会执行带有匹配 nonce 的脚本。攻击者注入的 `<script>` 没有这个 nonce，会被拦截。
- 这个选项只对 SSR 有效。对 SSG（`nuxt generate`）会被忽略。

### csrf

```ts
csrf: false,
```

- `nuxt-security` 内置了一套 CSRF 方案（基于 `nuxt-csurf`），默认关闭。
- 这里显式写 `false`，是为了说明项目使用的是自己的双重 cookie 方案（`nuxt_pilot_csrf` cookie 加 `x-csrf-token` 请求头）。
- 两套方案同时开启会重复校验并产生冲突，所以保持关闭。

### removeLoggers

```ts
removeLoggers: false,
```

- 模块默认会在生产构建里移除 `console.log`、`console.debug` 等调用。
- 项目的 `server/utils/logger.ts` 通过 `console.log` 和 `console.error` 输出访问日志和上游请求日志。如果被移除，生产环境就没有日志了。
- 所以必须关闭。

### xssValidator

```ts
xssValidator: false,
```

- 这是模块的一个服务端中间件，默认会检查 GET 和 POST 的参数和请求体，一旦发现像 HTML 或脚本的内容就直接返回 400。
- 它会误伤正常数据，比如包含 `<` 的密码或备注。
- 它也不是防 XSS 的主要手段。真正的防护是 CSP 和模板的输出转义，所以关闭。

### rateLimiter

```ts
rateLimiter: false,
```

- 模块默认限流为每个 IP 5 分钟 150 次请求，超出直接报错。
- 这是新增的行为，会作用于所有路由，包括页面和静态资源。
- 在反向代理或 CDN 后面，如果没有配好真实 IP 的来源，所有用户可能被当成同一个 IP 而互相影响。
- 所以这次不启用。需要限流时，建议单独评估后再配置。

### requestSizeLimiter

```ts
requestSizeLimiter: false,
```

- 模块默认限制普通请求体 2MB、上传请求 8MB。
- 同样是新增行为，不在这次迁移范围内，所以关闭。

### corsHandler

```ts
corsHandler: false,
```

- 模块默认会处理 CORS，把允许的来源设置为站点自己的地址，并响应预检请求。
- 项目现在的 API 只给同源的页面使用，`routeRules` 里 `/api/**` 也已经写了 `cors: false`。
- 关闭后保持和迁移前一致：不额外加 CORS 头。

## 4. 响应头

```ts
headers: {
```

`headers` 下的每一项对应一个响应头。写 `false` 表示不发送这个头。

### contentSecurityPolicy（CSP）

```ts
contentSecurityPolicy: {
```

CSP 告诉浏览器页面允许加载和执行哪些资源。每个键是一个指令，值是允许的来源列表。

```ts
'default-src': ["'self'"],
```

- 所有没有单独声明的资源类型，默认只允许同源。
- 比如 `media-src`、`frame-src`、`worker-src` 都没有单独写，就会回退到这里。
- `'self'` 表示和当前页面同协议、同域名、同端口。

```ts
'script-src': [
  "'self'",
  "'strict-dynamic'",
  "'nonce-{{nonce}}'",
  ...(isDevelopment ? ["'unsafe-eval'"] : [])
],
```

这是最关键的一条，控制脚本能不能执行。

- `'nonce-{{nonce}}'`：只允许带正确 nonce 的脚本。Nuxt 输出的入口脚本和 `__NUXT_DATA__` 内联脚本都会被自动加上 nonce，所以能正常运行。`{{nonce}}` 是占位符，每个请求会换成真实值。
- `'strict-dynamic'`：已经被信任（带 nonce）的脚本，可以继续动态加载其他脚本，这些子脚本不需要再带 nonce。Nuxt 的 hydration 和路由 chunk 懒加载正是靠这个才能工作。
- `'self'`：只给不支持 `strict-dynamic` 的老浏览器做回退。在支持 `strict-dynamic` 的浏览器里，`'self'` 会被忽略。
- 这里没有 `'unsafe-inline'`，也没有 `https:`。这就是生产环境不再允许任意内联脚本的原因。
- 开发环境额外加了 `'unsafe-eval'`，因为 Vite 和 Nuxt DevTools 的调试能力可能用到 `eval`。生产环境不加。

```ts
'style-src': ["'self'", "'unsafe-inline'"],
```

- 样式只允许同源文件和内联样式。
- 这里保留了 `'unsafe-inline'`，是有意的取舍：Nuxt 的 hydration 和 Vue 模板里的 `:style` 绑定依赖内联样式，这也是 `nuxt-security` 官方推荐的做法。
- 迁移前的生产配置是只有 `'self'`，更严格，但这会拦截内联样式。
- 内联样式的风险比内联脚本小很多，主要靠把 `img-src` 收紧来降低。

```ts
'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
```

- 图片允许来自：同源、`data:` URL、`blob:` URL（比如上传预览），以及 Unsplash 的图片域名。
- 项目的商品图片用到了 Unsplash，所以要单独放行。换了图片来源要在这里同步修改。

```ts
'font-src': ["'self'", 'data:'],
```

- 字体只允许同源和 `data:` URL。
- 模块默认的 `https:` 被去掉了，避免加载任意第三方字体。

```ts
'connect-src': isDevelopment ? ["'self'", 'http:', 'https:', 'ws:', 'wss:'] : ["'self'"],
```

- 控制 `fetch`、`XMLHttpRequest`、WebSocket 等能连接到哪里。
- 生产只允许同源。这和项目的架构一致：浏览器只请求 Nuxt 的 `/api/*`，真实后端地址不暴露。
- 开发环境放开所有 http、https、ws、wss，因为本地要连后端，Vite 的热更新也要用 WebSocket。

```ts
'object-src': ["'none'"],
```

- 禁止 `<object>`、`<embed>` 等插件类内容。

```ts
'frame-ancestors': ["'none'"],
```

- 禁止任何网站用 `<iframe>` 嵌入本站，防止点击劫持。
- 它的作用和下面的 `xFrameOptions: 'DENY'` 一样，两个都设置是为了兼容老浏览器。

```ts
'base-uri': ["'self'"],
```

- `<base>` 标签只能指向同源，防止攻击者通过它改变页面里相对路径的解析基准。
- 模块默认是 `'none'`，这里保持迁移前的 `'self'`。

```ts
'form-action': ["'self'"],
```

- 表单只能提交到同源地址，防止表单被劫持后把数据发到别的站点。

```ts
'upgrade-insecure-requests': !isDevelopment
```

- 生产环境为 `true`，会在响应头里加上 `upgrade-insecure-requests` 指令，让浏览器把页面里的 `http://` 子资源自动升级成 `https://`，避免混合内容。
- 开发环境为 `false`，不输出这条指令。本地是 `http://localhost`，开启后可能把本地后端请求强行升级成 https 而失败。

模块还有一条默认值 `script-src-attr 'none'`，这里没有改，它会保留在响应头里。它禁止 HTML 里的内联事件处理器，比如 `onclick="..."`。项目里没有用到。

### 其他安全头

```ts
xContentTypeOptions: 'nosniff',
```

- 响应头 `X-Content-Type-Options: nosniff`。
- 让浏览器严格按 `Content-Type` 解析资源，不去猜测类型，防止把文本当脚本执行。

```ts
referrerPolicy: 'strict-origin-when-cross-origin',
```

- 同源跳转发送完整 URL，跨站只发送来源（域名），并且从 https 降级到 http 时不发。
- 模块默认是 `no-referrer`，这里保持迁移前的值。同源请求仍然带 `Referer`，`02-api-guard.ts` 的同源校验会用到它。

```ts
xFrameOptions: 'DENY',
```

- 禁止被 iframe 嵌入，和 `frame-ancestors 'none'` 配合，兼容老浏览器。
- 模块默认是 `SAMEORIGIN`，这里保持迁移前的严格值。

```ts
crossOriginOpenerPolicy: 'same-origin',
```

- `Cross-Origin-Opener-Policy`：让本站页面和它用 `window.open` 打开的跨源窗口隔离，防止跨窗口访问。

```ts
crossOriginResourcePolicy: 'same-origin',
```

- `Cross-Origin-Resource-Policy`：只允许同源的页面加载本站的资源，防止别的站点直接引用本站的图片或脚本。

```ts
crossOriginEmbedderPolicy: false,
```

- `Cross-Origin-Embedder-Policy` 不发送。
- 生产环境下模块默认会发 `credentialless`。迁移前项目没有这个头，而且它会影响页面嵌入跨域资源（比如 Unsplash 图片）的方式。
- 它只在需要跨源隔离（比如使用 `SharedArrayBuffer`）时才有必要，所以保持关闭。

```ts
permissionsPolicy: {
  camera: [],
  microphone: [],
  geolocation: [],
  fullscreen: ['self'],
  'display-capture': ['self']
},
```

- `Permissions-Policy` 控制页面能不能使用某些浏览器能力。空数组表示完全禁止，`['self']` 表示只允许同源。
- `camera`、`microphone`、`geolocation` 禁止，和迁移前一致。
- 模块的默认值还会禁用 `fullscreen` 和 `display-capture`，这是迁移前没有的限制。这里改为 `['self']`，恢复成浏览器的默认行为，避免页面里的全屏功能意外失效。
- 对象会和模块的默认值合并，所以不能用"不写"来取消默认项，必须显式写出来覆盖。

```ts
strictTransportSecurity: isDevelopment
  ? false
  : { maxAge: 31536000, includeSubdomains: true, preload: true }
```

- `Strict-Transport-Security`（HSTS）告诉浏览器：这个站点以后只用 https 访问。
- 开发环境不发送（`false`）。本地是 http，发送没有意义，也可能让本机其他项目被误伤。
- 生产环境：
  - `maxAge: 31536000`，有效期一年。
  - `includeSubdomains: true`，所有子域名也只能用 https。
  - `preload: true`，声明允许被加入浏览器内置的 HSTS 预加载列表。
- 注意：`includeSubdomains` 会影响所有子域名。上线前要确认子域名都支持 https，否则它们会无法访问。`preload` 本身只是声明，真正加入预加载列表需要另外到 hstspreload.org 提交，而且之后很难撤销。

## 5. 实际效果

生产构建后，页面响应里的 CSP 形如：

```txt
Content-Security-Policy: base-uri 'self'; font-src 'self' data:; form-action 'self';
frame-ancestors 'none'; img-src 'self' data: blob: https://images.unsplash.com;
object-src 'none'; script-src-attr 'none'; style-src 'self' 'unsafe-inline';
script-src 'self' 'strict-dynamic' 'nonce-<每次请求不同>'; upgrade-insecure-requests;
default-src 'self'; connect-src 'self';
```

`Permissions-Policy` 为：

```txt
camera=(), display-capture=(self), fullscreen=(self), geolocation=(), microphone=()
```

## 6. 已知限制

1. 配置了 `swr` 的路由（`/`、`/products/**`）会缓存整页 HTML 和响应头。缓存期内所有访客共用同一个 nonce，所以这些路由的 nonce 不是一次性的。需要每次请求都换 nonce，就要去掉这些路由的 `swr`，代价是每次请求都重新渲染。
2. `style-src` 保留了 `'unsafe-inline'`，样式层面没有 nonce 防护。
3. CSP 防的是脚本注入。CSRF token cookie 是 `httpOnly: false`（双重 cookie 方案需要前端读取），所以一旦出现 XSS，攻击者仍然能读到它。CSP 是降低 XSS 发生概率和影响的手段，不能替代对 `v-html` 等不可信内容渲染的审查。
4. 页面响应有完整的 CSP。`/api/*` 的 JSON 响应不走页面渲染流程，不带这份 CSP，但仍带 `X-Content-Type-Options`、`X-Frame-Options`、HSTS 等通用头。
5. 开发环境的策略没有实际启动 `nuxt dev` 验证过，以上关于开发环境的说明来自配置本身。

## 7. 常见修改场景

- 新增图片域名：修改 `img-src`。
- 新增要调用的第三方接口：修改 `connect-src`，但本项目的设计是浏览器只访问同源 `/api/*`，优先考虑通过 BFF 转发。
- 引入第三方脚本：推荐用 `useScript`，由入口脚本加载，在 `strict-dynamic` 下可以工作。不要为此退回 `'unsafe-inline'`。
