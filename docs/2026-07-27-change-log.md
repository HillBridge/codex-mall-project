# 2026-07-27 修改记录

## 1. SSR API 请求改为使用 request-aware fetch

问题：个人信息页登录后刷新会跳转到 `/login?redirect=/account/profile`。

根因：SSR 中间件里通过 `$api` 请求 `/api/auth/me` 时，底层使用裸 `ofetch`。Node 服务端无法直接解析 `/api/auth/me` 这种相对地址，导致恢复登录态失败。

修改：

- `app/plugins/api.ts` 在服务端注入 `useRequestFetch()`
- `app/utils/api-client.ts` 支持外部传入 fetcher
- 客户端仍继续复用普通 `$fetch`

结果：刷新 `/account/profile` 时，SSR 能正确请求 Nuxt BFF 的 `/api/auth/me`。

## 2. API Client 支持客户端复用和 SSR 请求隔离

问题：API 封装既要避免每次请求都新建完整实例，又要避免 SSR 场景下不同用户 cookie 混用。

修改：

- 客户端按 `baseURL` 缓存基础 fetch 能力
- 服务端每个 Nuxt app/SSR 请求创建当前请求自己的 `$api`
- 当前请求的 cookie、`x-request-id` 只保存在当前 wrapper 中

结果：客户端避免重复创建基础能力，服务端保持请求级隔离。

## 3. BFF 转发真实后端 Set-Cookie 更稳

问题：BFF 从 Koa 后端收到多个 `Set-Cookie` 时，如果处理不当，可能只转发一个 cookie，导致 `nuxt_pilot_session` 或 `nuxt_pilot_logged_in` 丢失。

修改：

- `server/utils/upstream.ts` 支持 `headers.getSetCookie()`
- fallback 场景使用 `splitCookiesString()` 拆分多个 cookie
- 转发 `x-forwarded-host` 和 `x-forwarded-proto`

结果：登录接口可以稳定把真实后端设置的多个 cookie 回写给浏览器。

## 4. 登录提示 cookie 改为前端只读

问题：`nuxt_pilot_logged_in` 原先通过 Nuxt `useCookie()` 读取和写入，容易因为编码、默认配置或空值同步导致前端误写/误删。

修改：

- 删除 `app/composables/useLoggedInHintCookie.ts`
- 新增 `app/utils/auth-cookie.ts`
- 前端只用 `document.cookie` 判断是否存在 `nuxt_pilot_logged_in=1`
- `app/stores/session.ts` 不再写入或清除该 cookie

结果：`nuxt_pilot_logged_in` 只由真实后端创建和删除，前端只把它当作“是否尝试恢复登录”的提示位。

## 5. Backend Session 从内存 Map 升级为签名 token

问题：旧实现把 session token 存在 Koa 进程内存 `Map` 中。后端重启、热更新或多实例时，浏览器 cookie 还在，但后端内存 session 会丢。

修改：

- `backend/services/session-service.mjs` 改为 HMAC 签名 session token
- token 中包含用户 id、session id、过期时间
- `/auth/me` 通过签名校验和过期时间恢复用户

结果：真实后端不再依赖单进程内存保存 session。

## 6. features 目录组件取消全局注册

问题：`nuxt.config.ts` 原先自动注册 `features/**/components/**/*.vue`，业务页面无法从代码上直接看出组件来源。

修改：

- `nuxt.config.ts` 只保留 `components: ['~/components']`
- `ProductCard` 在使用页面显式引入
- 修改页面：
  - `app/pages/index.vue`
  - `app/pages/products/index.vue`

结果：features 模块内组件来源更清晰，页面依赖关系更显式。
