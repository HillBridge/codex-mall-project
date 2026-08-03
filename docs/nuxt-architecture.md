# Nuxt 中大型项目落地方案

## 1. 项目定位

这个项目按中大型 C 端应用来设计，即使当前业务偏后台，也先把 Nuxt 的关键复杂度处理掉。目标是让团队在真实项目里沉淀 SSR、BFF、缓存、鉴权、SEO、模块化和部署经验。

## 2. 架构分层

```txt
Browser
  -> Nuxt app/pages
  -> app/features/*
  -> app/composables + app/stores
  -> server/api BFF
  -> upstream services
```

### `app/pages`

只放路由编排、页面级数据请求、SEO 和页面状态。页面不要沉淀复杂业务逻辑。

### `app/features`

按业务域拆模块。每个模块可以拥有自己的组件、组合函数、类型和后续测试。当前示例是 `products`。

### `app/composables`

放跨业务能力，例如 `useApiClient`、`useApiQuery`、`usePageSeo`。这层要稳定、少而精。

### `app/stores`

Pinia 只保存跨页面状态，例如会话、购物车、全局偏好。服务端可直接算出的页面数据优先使用 `useAsyncData/useFetch`。

### `server/api`

作为 BFF 层，隔离浏览器和真实后端。它负责聚合、裁剪、鉴权、错误标准化和安全头，不让页面直接理解多个后端服务。

所有成功响应统一返回 `{ data, traceId }`，前端通过 `useApiClient` 自动拆包。页面 SSR 数据统一走 `useApiQuery`，用户操作请求统一走 `useApiClient`。

### `shared`

放前后端共享的纯类型和 API 契约。不要在这里放依赖浏览器或服务端运行时的代码。

## 3. 相比 Vue SPA 更复杂的点

### SSR 数据一致性

SPA 只在浏览器请求数据，Nuxt 会先在服务端跑一次，再在客户端接管。项目用 `useApiQuery` 处理普通 SSR 页面数据，用 `useQueryDrivenList` 处理 URL query 驱动的复杂列表页，用 `useApiClient` 处理命令式请求，避免同一接口在 SSR 与 CSR 行为不一致。

落地点：

- `app/composables/useApiQuery.ts`
- `app/composables/useQueryDrivenList.ts`
- `app/composables/useApiClient.ts`
- `app/pages/index.vue`
- `app/pages/products/index.vue`

### 鉴权边界

SPA 常把 token 放浏览器存储，Nuxt 更适合用 httpOnly Cookie，让服务端也能判断登录态。项目由 `backend/` Koa 服务管理真实 Cookie 会话，Nuxt `server/api` 作为 BFF 转发 cookie 与 `Set-Cookie`，会话页用 `app/middleware/auth.ts` 拦截。

落地点：

- `server/api/auth/login.post.ts`
- `server/api/auth/me.get.ts`
- `server/api/auth/logout.post.ts`
- `app/stores/session.ts`
- `app/pages/account/profile.vue`

当前后端使用 HMAC 签名的无状态 session token，不依赖进程内存 Map。生产环境可以继续使用签名 token，也可以按业务需要替换为 Redis、数据库会话表或后端统一 session 服务。

### BFF 与接口聚合

Nuxt 的 `server/api` 不是简单 mock，而是前端项目里的 BFF 层。它应该负责屏蔽后端复杂度，把页面需要的数据结构稳定下来。

落地点：

- `server/api/products/index.get.ts`
- `server/api/products/[slug].get.ts`
- `backend/app.mjs`
- `backend/services/session-service.mjs`
- `server/utils/upstream.ts`

当前真实后端已放在 `backend/`，由 Koa 实现。页面和组件不直接请求 Koa，只访问 Nuxt `/api/*`，BFF 负责协议适配和安全边界。

### 缓存策略

C 端项目通常既要快，又要数据足够新。项目用 `routeRules` 区分页面缓存和接口缓存：商品详情页可以 SWR，带搜索和筛选 query 的商品列表页不做页面缓存，接口默认 `no-store`，账户页保持 SSR。

落地点：

- `nuxt.config.ts`

建议规则：

- 首页或活动页：可预渲染或 ISR
- 商品列表：如果受 query 筛选影响，禁用页面缓存或确保缓存按 query 维度隔离
- 商品详情：中等 SWR
- 账户、订单、支付：禁用公共缓存
- BFF 接口：默认不缓存，明确确认后再打开

### SEO 与社交分享

Nuxt 的 SEO 不该散落在各页面里重复写。项目用 `usePageSeo` 统一标题、描述和分享图规则。

落地点：

- `app/composables/usePageSeo.ts`

### Hydration 风险

服务端 HTML 和客户端首屏状态必须一致。这个项目避免在模板首屏直接使用 `window`、随机数和当前时间。需要客户端能力时放进 `onMounted` 或 `.client` 组件。

### 路由与错误边界

Nuxt 文件路由会带来动态页、错误页和中间件链路。项目已经补了动态商品页、登录跳转和全局错误页。

落地点：

- `app/pages/products/[slug].vue`
- `app/error.vue`
- `app/middleware/auth.ts`

### 类型共享

中大型项目最怕前后端字段漂移。示例用 `shared/types` 给页面、组件和 BFF 共用类型。真实项目可以进一步接 OpenAPI、tRPC、GraphQL Codegen 或后端 SDK。

落地点：

- `shared/types/product.ts`
- `shared/types/user.ts`

### 安全与观测

Nuxt 服务端也在请求链路里，必须补安全头和请求 ID。示例用 server middleware 做统一处理。

落地点：

- `server/middleware/security-headers.ts`
- `server/middleware/request-id.ts`

## 4. 推荐演进路线

1. 先把当前后台业务完整迁到 Nuxt 页面、BFF 和鉴权链路里。
2. 把真实后端接口接入 `server/api`，保持页面数据结构稳定。
3. 补端到端测试，覆盖登录、列表筛选、详情页和受保护页面。
4. 引入部署平台缓存规则，校验 `routeRules` 在目标平台的真实表现。
5. 当业务模块变多后，把稳定模块抽成 Nuxt layer。

## 5. 团队约定

- 页面负责编排，业务逻辑沉到 feature。
- 跨业务工具先放 composables，超过两个调用方再抽象。
- 账户、订单、支付等私密页面永远不要使用公共缓存。
- SSR 数据请求必须考虑 Cookie、请求头和错误状态。
- 客户端专属逻辑必须显式隔离，避免 hydration mismatch。
- BFF 返回给页面的数据结构要稳定，不能把后端原始结构直接泄露到 UI。
