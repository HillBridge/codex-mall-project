# Nuxt Pilot

这是一个用于真实试水 Nuxt 的中大型 C 端项目骨架。它不是把 Vue SPA 换成 Nuxt 壳子，而是把 Nuxt 更容易踩坑的部分直接落到工程里：SSR 数据获取、BFF 接口、Cookie 鉴权、路由级缓存、SEO、状态管理和业务模块拆分。

## 本地运行

```bash
pnpm install
pnpm backend
pnpm dev
```

默认演示账号：

```txt
邮箱：demo@example.com
密码：nuxt-demo
```

## 目录说明

```txt
app/
  components/          通用 UI 和应用骨架组件
  composables/         跨模块组合函数，例如 API client、SSR 数据和 SEO
  features/            按业务特性组织代码
  layouts/             页面布局
  middleware/          路由中间件
  pages/               文件路由
  stores/              Pinia 状态
server/
  api/                 Nitro BFF 接口
  middleware/          服务端请求中间件
  utils/               服务端响应协议和上游 client
backend/
  app.mjs              Koa 真实后端服务
  services/            真实后端业务服务
  data/                演示数据源
shared/
  types/               前后端共享类型和 API 契约
docs/
  nuxt-architecture.md 架构说明
  api-architecture.md  API 层说明
```

## 已落地能力

- SSR 首屏数据：`app/pages/index.vue` 和 `app/pages/products/index.vue`
- BFF 接口：`server/api/products/*`、`server/api/auth/*`
- Koa 真实后端：`backend/app.mjs`
- API 请求封装：`app/composables/useApiClient.ts`、`app/composables/useApiData.js`
- API 响应协议：`server/utils/api-response.ts`
- 服务端上游 client：`server/utils/upstream.ts`
- Cookie 鉴权：`backend/services/session-service.mjs`、`app/middleware/auth.ts`
- 状态管理：`app/stores/session.ts`
- SEO：`app/composables/usePageSeo.ts`
- 路由缓存：`nuxt.config.ts` 的 `routeRules`
- 特性模块：`app/features/products`

更完整的设计取舍见 [docs/nuxt-architecture.md](./docs/nuxt-architecture.md) 和 [docs/api-architecture.md](./docs/api-architecture.md)。
