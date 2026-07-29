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

## 7. BFF 和 Backend 增加请求日志

问题：本地重启服务并重新登录后，控制台只能看到启动信息，看不到登录、接口转发、后端处理这些请求链路日志。

根因：此前只在启动命令里加入了 `LOG_LEVEL`、`LOG_FORMAT` 等环境变量，但项目里还没有真正实现 logger，也没有在 BFF 和 Koa backend 的请求入口处打印访问日志。

修改：

- 新增 `server/utils/logger.ts`，作为 Nuxt BFF 侧日志工具
- 新增 `backend/utils/logger.mjs`，作为 Koa backend 侧日志工具
- 新增 `server/middleware/03-access-log.ts`，记录浏览器进入 BFF 的请求日志
- 修改 `server/utils/upstream.ts`，记录 BFF 调用真实 backend 的 upstream 日志
- 修改 `backend/app.mjs`，记录真实 backend 收到的请求日志
- 修改 `package.json`，增加本地和生产日志启动命令
- `.gitignore` 增加 `logs/`，避免本地日志文件进入版本管理

当前日志分三类：

```txt
bff.access     浏览器 -> Nuxt BFF 的请求
bff.upstream   Nuxt BFF -> Koa backend 的请求
backend.access Koa backend 实际处理的请求
```

一次登录成功时，控制台会看到类似日志：

```txt
[INFO] bff.upstream POST /auth/login 200 20ms traceId=8066b346-7fe3-4ef8-bc8b-5e3bdc047f83
[INFO] bff.access POST /api/auth/login 200 26ms traceId=8066b346-7fe3-4ef8-bc8b-5e3bdc047f83
[INFO] backend.access POST /auth/login 200 11ms traceId=8066b346-7fe3-4ef8-bc8b-5e3bdc047f83
```

这里的 `traceId` 用来串起同一次请求链路。排查登录、刷新、商品接口、后端鉴权问题时，可以先用同一个 `traceId` 同时查 BFF 日志和 backend 日志。

本地开发默认使用可读性更好的 pretty 日志：

```bash
pnpm backend
pnpm dev
```

如果想同时写入本地文件：

```bash
pnpm backend:log
pnpm dev:log
```

日志文件位置：

```txt
logs/backend-local.log
logs/nuxt-local.log
```

生产环境默认使用 JSON 日志，方便容器平台、云日志、ELK、Loki、Datadog 等系统采集：

```bash
pnpm start:backend
pnpm start:nuxt
```

设计原则：

- 本地日志优先可读：`LOG_LEVEL=debug`、`LOG_FORMAT=pretty`
- 生产日志优先采集：`LOG_LEVEL=info`、`LOG_FORMAT=json`
- 默认不记录完整请求参数，避免密码、token、cookie、手机号等敏感信息进入日志
- 只记录方法、路径、状态码、耗时、traceId、query key、错误码等排查必要信息
- 错误日志走 `console.error`，普通日志走 `console.log`

结果：登录、刷新、商品列表、个人信息等接口请求现在都能在控制台看到完整链路日志；需要持久化时，可以用 `*:log` 命令将 stdout 同步写入本地 `logs/` 文件。

## 8. 补齐 BFF/Backend 错误处理体验层

问题：BFF 层服务出错、Koa backend 服务出错时，前端虽然能收到标准错误，但用户体验还不完整。部分页面只显示固定文案，操作失败没有统一提示，详情页在后端不可用时可能被误判成“商品不存在”，生产环境也不应该把内部 `details` 暴露给浏览器。

修改：

- 新增 `app/utils/api-error.ts`，把 `ApiClientError` 转成用户可读的错误视图
- 新增 `app/composables/useApiErrorHandler.ts`，统一处理操作型接口错误
- 新增 `app/composables/useAppMessage.ts`，管理全局消息状态
- 新增 `app/components/ui/AppMessages.vue`，展示全局错误提示和 `traceId`
- `app/layouts/default.vue` 挂载全局消息组件
- 首页和商品列表页使用 `createApiErrorView()` 展示局部错误块
- 商品详情页根据真实错误类型抛出页面错误，不再把 backend 不可用误判成 404
- 登录页使用统一错误翻译，不再只写固定失败文案
- 退出登录失败时通过全局消息提示用户
- `app/error.vue` 展示 `traceId`，方便用户反馈和日志排查
- `server/utils/api-response.ts` 和 `backend/app.mjs` 在生产环境隐藏 `details`
- `app/assets/css/main.css` 增加局部错误、全局消息和错误编号样式

错误分类：

```txt
401 / UNAUTHORIZED      需要重新登录
403 / FORBIDDEN         请求被安全策略拦截
404 / NOT_FOUND         内容不存在或已下架
422 / VALIDATION_ERROR  表单内容需要调整
502 / UPSTREAM_ERROR    后端服务暂时不可用
500 / INTERNAL_ERROR    页面暂时不可用
```

结果：BFF 或 Koa backend 出错时，前端不会直接暴露内部异常；用户能看到明确提示、重试入口和错误编号，研发可以用同一个 `traceId` 关联浏览器响应、BFF 日志和 backend 日志。

## 9. 补齐客户端运行时错误治理

问题：接口错误治理只能处理 BFF/backend 请求失败，不能覆盖前端组件运行时异常、第三方库异常、未处理 Promise、发版后旧页面加载 chunk 失败等问题。这些问题如果没有兜底，用户可能看到空白页，或者只能看到 Nuxt/Vite 开发错误浮层。

修改：

- 新增 `app/components/ui/AppErrorBoundary.vue`
  - 客户端捕获子组件运行时错误
  - 显示模块级降级 UI
  - 提供“重试”和“刷新页面”
  - SSR 阶段不吞错误，继续交给 Nuxt 错误页处理
- 修改 `app/app.vue`
  - 用 `AppErrorBoundary` 包住 `NuxtLayout + NuxtPage`
  - `AppMessages` 保持在应用根部，确保跨 layout 生效
- 新增 `app/plugins/client-errors.client.ts`
  - 捕获 `vue:error`
  - 捕获 `app:error`
  - 捕获 `window error`
  - 捕获 `unhandledrejection`
  - 捕获 `vite:preloadError`
  - 识别 chunk 加载失败并提示用户刷新
- 新增 `app/utils/client-error.ts`
  - 统一格式化客户端错误
  - 统一输出开发日志
  - 预留 `window.__NUXT_PILOT_REPORT_ERROR__` 上报扩展点
- 升级 `app/composables/useAppMessage.ts`
  - 全局消息支持动作按钮
  - 支持 `reload` 和 `home` 这类安全动作
- 升级 `app/components/ui/AppMessages.vue`
  - 支持“刷新页面”等操作按钮
- 修改 `app/assets/css/main.css`
  - 增加运行时错误兜底 UI
  - 增加全局消息动作按钮样式

结果：当前项目除了 API 错误体验外，也具备了前端运行时错误、chunk 加载失败、组件局部崩溃的基础兜底能力。用户不应该直接面对空白页；研发也有统一的前端错误上报入口，后续可以平滑接入 Sentry、Datadog 或内部监控平台。
