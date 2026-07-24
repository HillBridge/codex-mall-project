# API 层架构

这个项目把 API 分成三层，分别解决浏览器请求、页面 SSR 数据、Nuxt BFF 到真实后端的边界。

## 1. 前端请求入口

### `useApiClient`

位置：`app/composables/useApiClient.ts`

用于命令式请求，例如登录、登出、提交表单、收藏、加入购物袋。它不创建 `$fetch` 实例，只返回 Nuxt plugin 注入的 `$api`。

真正的 `$fetch.create` 在 `app/plugins/api.ts` 中完成：

- 服务端：每个 SSR request 创建一次，携带当前请求的 cookie 与 request-id
- 客户端：Nuxt app 初始化时创建一次，后续组件和 store 复用
- 两端统一：baseURL、credentials、错误归一化、响应拆包都走同一套逻辑

底层实现位于 `app/utils/api-client.ts`，这里集中维护拦截器和响应格式适配。

调用方只写业务路径，不写 `/api` 前缀：

```ts
const apiFetch = useApiClient()
const user = await apiFetch('/auth/me')
```

它统一处理：

- `baseURL = runtimeConfig.public.apiBase`
- Cookie 鉴权：`credentials: include`
- SSR Cookie 和 `x-request-id` 转发
- `x-requested-with` 请求头，用于写接口基础防护
- 服务端 `{ data, traceId }` 响应拆包
- API 错误标准化

### `useApiData`

位置：`app/composables/useApiData.js`

用于页面数据获取，内部基于 `useAsyncData`，适合 SSR 首屏、列表页、详情页。

```ts
const { data, pending, error, refresh } = await useApiData('/products', {
  query: { featured: true },
  key: 'home-featured-products',
  default: () => []
})
```

页面不要直接使用 `$fetch` 拉首屏数据，避免 SSR/CSR 行为不一致。

### `useQueryDrivenList`

位置：`app/composables/useQueryDrivenList.ts`

用于“SSR 首屏 + URL query 筛选 + 客户端继续筛选”的 C 端列表页，例如商品搜索、内容检索、酒店/机票列表。它统一处理：

- SSR 首屏写入 `useState`
- 客户端 hydration 复用 SSR 数据
- 筛选签名一致时不重复请求
- 用户操作后显式刷新
- pending/error
- 旧请求不覆盖新请求

业务模块只需要提供：

```ts
return await useQueryDrivenList({
  key: 'products:catalog',
  filter,
  getSignature: createCatalogSignature,
  fetcher: (nextFilter) => apiFetch('/products', { query: nextFilter })
})
```

## 2. 共享契约

位置：`shared/types/api.ts`

核心类型：

```ts
ApiSuccess<T>
ApiFailure
ApiClientError
ApiRouteMap
ApiResponseFor<TPath>
```

当前项目使用轻量手写契约。真实后端稳定后，可以迁移到 OpenAPI Codegen、tRPC、GraphQL Codegen 或后端 SDK。

## 3. BFF 响应协议

所有 `server/api` 成功响应统一：

```ts
{
  data: T,
  traceId: string
}
```

错误响应统一通过 `throwApiError`：

```ts
throwApiError(event, {
  statusCode: 422,
  code: 'VALIDATION_ERROR',
  message: '参数不合法',
  details
})
```

这样前端能统一处理 toast、表单错误、登录失效、监控和客服排查。

## 4. 服务端上游请求

位置：`server/utils/upstream.ts`

`createUpstreamClient(event)` 用于 Nuxt BFF 请求真实后端。它统一处理：

- `runtimeConfig.apiBaseInternal`
- `x-request-id` 透传
- 超时
- 简单重试
- 上游错误映射

现在商品服务在没有 `apiBaseInternal` 时使用 mock 数据；配置后会走真实上游：

```ts
NUXT_API_BASE_INTERNAL=https://backend.example.com
```

## 5. 安全边界

位置：`server/middleware`

中间件顺序：

```txt
00-request-id.ts
01-security-headers.ts
02-api-guard.ts
```

`02-api-guard.ts` 对 `POST/PUT/PATCH/DELETE` 的 `/api/*` 请求要求 `x-requested-with: NuxtPilotClient`。这不是完整 CSRF 方案，但能挡住普通跨站表单提交。生产中的订单、支付、资料修改等接口还应加 CSRF token 或后端同等机制。

## 6. 团队使用约定

- 页面 SSR 数据用 `useApiData`
- 用户操作请求用 `useApiClient`
- 业务代码只写 `/products`、`/auth/me` 这类业务路径
- 不在页面里直接写 `/api`
- 不在页面里直接请求真实后端
- `server/api` 只返回稳定 DTO，不把上游原始结构泄露给 UI
- 新接口要先补 `shared/types/api.ts` 的路由契约
