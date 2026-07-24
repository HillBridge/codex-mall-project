# API 层架构

这个项目把 API 分成三层，分别解决浏览器请求、页面 SSR 数据、Nuxt BFF 到真实后端的边界。

## 1. 前端请求入口

### `useApiClient`

位置：`app/composables/useApiClient.ts`

用于命令式请求，例如登录、登出、提交表单、收藏、加入购物袋。它不创建 `$fetch` 实例，只返回 Nuxt plugin 注入的 `$api`。

`app/plugins/api.ts` 负责注入 `$api`，真正的 `$fetch.create` 在 `app/utils/api-client.ts` 中按 `baseURL` 缓存：

- 服务端：底层 `$fetch` 进程级复用，但不保存 cookie
- SSR 请求级：每个 request 创建轻量 `$api` wrapper，只保存当前请求的 cookie 与 request-id
- 客户端：Nuxt app 初始化时创建一次，后续组件和 store 复用
- 两端统一：baseURL、credentials、错误归一化、响应拆包都走同一套逻辑

这条边界很关键：**全局只复用无用户态能力，用户态 headers 只存在于当前 SSR 请求的 wrapper 里。**

### SSR 请求隔离与 Cookie 串号风险

浏览器端是每个用户一个运行环境，服务端则是很多用户共用同一个 Node/Nitro 进程。这是 SSR 项目里必须先建立的基本认知。

服务端可以复用无状态能力，例如：

- `baseURL`
- `timeout`
- `retry`
- 错误解析函数
- 不携带用户信息的基础 `$fetch` 实例

但不能全局复用用户态数据，例如：

- `cookie`
- `authorization`
- 当前用户信息
- 当前请求的 `x-request-id`
- 当前用户的 locale、实验分组等请求态信息

如果把 cookie 放到服务端全局变量、模块顶层对象，或者长期存在的 `$fetch` 实例里，就可能出现串号。错误示意：

```ts
let currentCookie = ''

const api = $fetch.create({
  onRequest({ options }) {
    options.headers = {
      cookie: currentCookie
    }
  }
})
```

服务端同一个进程会同时处理多个用户请求：

```txt
A 请求进来，currentCookie = "A 的 cookie"
B 请求进来，currentCookie = "B 的 cookie"
A 的 SSR 还没结束，又发起接口请求
读取 currentCookie 时，可能已经变成 "B 的 cookie"
```

这就是 cookie 串用。它会造成严重安全问题：

- B 打开个人中心，却看到 A 的资料
- B 打开购物车，却看到 A 的商品
- B 查询订单，却拿到 A 的订单列表
- B 执行加入购物车、收藏、提交资料等写操作时，可能写到 A 的账号下
- 日志、审计、风控都会出现身份混乱

因此本项目采用两层 API Client：

```txt
baseFetch
  进程级复用
  不保存 cookie

当前 SSR 请求的 $api wrapper
  只属于本次 SSR 上下文
  保存当前请求的 cookie / x-request-id
  发请求时再合并进 headers
```

这样既减少了重复创建完整 `$fetch` 实例的成本，又能保证用户身份只存在于当前 SSR 请求里。

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
