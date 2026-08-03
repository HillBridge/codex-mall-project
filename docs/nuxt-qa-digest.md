# Nuxt 试水问答浓缩

这份文档浓缩本项目落地 Nuxt 过程中反复讨论和修正过的问题。它不是 API 细节手册，而是帮助团队理解为什么这样设计、曾经踩过什么坑、以后遇到同类问题应该怎么判断。

## 1. 为什么坚持按中大型 C 端项目设计

虽然当前业务偏后台，但这个项目的目标不是只把页面跑起来，而是提前验证 Nuxt 在真实中大型 C 端项目里的复杂点：

- SSR 首屏数据
- BFF 层
- Cookie 鉴权
- 页面刷新后的登录态恢复
- URL query 驱动的数据列表
- Hydration 一致性
- 接口封装
- 路由缓存
- SEO
- 模块化目录

因此项目不按简单 Vue SPA 思路处理，而是把 Nuxt 的服务端和客户端双运行环境当成核心架构问题来设计。

## 2. 为什么 `account/profile` 登录后刷新还能拿到数据

登录成功后，服务端会写入真正的登录凭证：

```txt
nuxt_pilot_session
```

这个 cookie 是 `httpOnly` 的，浏览器 JS 读不到，但浏览器刷新页面时会自动带给 Nuxt 服务端。

刷新 `/account/profile` 时流程是：

```txt
浏览器请求 /account/profile
  ↓
自动携带 nuxt_pilot_session
  ↓
Nuxt 服务端 SSR
  ↓
SSR 阶段调用 /api/auth/me
  ↓
BFF 从当前请求 cookie 中识别用户
  ↓
返回用户数据
  ↓
服务端把带用户数据的 HTML 发给浏览器
```

所以它不是靠 Pinia 本地状态恢复的，而是靠 cookie 在刷新请求中被服务端读取。

## 3. API 封装分几层

本项目把 API 分成三类入口。

`useApiClient`

用于用户操作触发的命令式请求，例如登录、登出、提交表单。业务侧只写：

```ts
const apiFetch = useApiClient()
await apiFetch('/auth/me')
```

`useApiQuery`

用于普通 SSR 页面数据。它基于 `useAsyncData`，适合首页、详情页、简单列表页。

`useQueryDrivenList`

用于复杂 C 端列表页，例如商品搜索、内容检索、酒店列表。它处理：

- SSR 首屏数据
- URL query 筛选
- 客户端继续搜索
- hydration 复用 SSR 数据
- 旧请求不覆盖新请求
- pending/error

业务模块只需要提供筛选条件和 fetcher。

## 4. 为什么页面查询封装命名为 `useApiQuery.ts`

命名为 `useApiQuery.ts` 是为了表达它的真实职责：它不是所有 API 请求的入口，而是支持 SSR 和客户端刷新的“查询型页面数据入口”。

最终边界是：

```txt
useApiClient
  命令式请求

useApiQuery
  普通 SSR 页面数据

useQueryDrivenList
  URL query 驱动的复杂 SSR 列表
```

这样命名更适合中大型项目，后续新人不容易误用。

## 5. CSP 是什么，为什么曾经影响登录

CSP 是 Content Security Policy，浏览器安全策略。它用来限制页面能执行哪些脚本、加载哪些资源，降低 XSS 风险。

当页面报类似错误：

```txt
Executing inline script violates Content Security Policy directive
```

意思是浏览器拒绝执行内联脚本。Nuxt SSR/hydration 过程中会有必要的初始化脚本，如果 CSP 配置过严，没有配置 nonce、hash 或允许策略，就可能导致客户端接管失败，表现为登录点击后页面没正常更新。

当前项目为了 Nuxt hydration 能正常工作，开发阶段放宽了脚本策略。生产环境更理想的方案是使用 nonce/hash，而不是长期粗暴放开所有内联脚本。

## 6. 商品页搜索为什么反复出问题

商品页的问题本质不是“搜索接口不会调”，而是 Nuxt 双端渲染下的状态一致性问题。

典型错误流程是：

```txt
刷新 /products?category=家居
  ↓
SSR 根据 URL query 请求到 家居 数据
  ↓
页面短暂显示正确数据
  ↓
客户端 hydration 接管
  ↓
客户端状态没有正确复用 SSR 数据或 filter
  ↓
又按默认条件请求全部商品
  ↓
家居数据被全部商品覆盖
```

另一个干扰因素是公共页面刷新时自动调用 `/api/auth/me`，如果没有登录会返回 401。这个请求如果影响了全局 session 或页面刷新逻辑，就会让商品页看起来像是“数据被清空”或“又变回全部商品”。

最终解决方案：

- 公共页面不要无条件调用 `/api/auth/me`
- 只有 `nuxt_pilot_logged_in = 1` 时才尝试恢复登录态
- 商品列表用 `useQueryDrivenList` 管理 SSR 数据、URL query 签名和客户端刷新
- 筛选条件必须从 `route.query` 派生，刷新后才能一一对应

## 7. 为什么商品列表逻辑后来抽成 `useQueryDrivenList`

不是每个 SSR 页面都要写复杂逻辑。

简单页面用：

```ts
await useApiQuery('/products')
```

只有同时满足这些条件时，才需要 `useQueryDrivenList`：

- 首屏要 SSR
- 数据由 URL query 决定
- 客户端还会继续搜索、切换分类、分页或排序
- 刷新后必须保持筛选条件
- hydration 不能覆盖 SSR 数据

抽离后的目标是：复杂度只存在于框架层，业务模块只描述“筛选条件怎么转接口参数”。

## 8. 为什么 API Client 不再每次 `$fetch.create`

早期 `useApiClient()` 内部每次都会 `$fetch.create`。这能工作，但中大型项目里不够理想。

现在改成：

```txt
app/plugins/api.ts
  注入 $api

app/utils/api-client.ts
  创建和缓存底层 fetch

app/composables/useApiClient.ts
  只返回 useNuxtApp().$api
```

业务侧用法不变，但底层职责更清楚。

## 9. 客户端为什么能复用 `$api`

客户端一个浏览器 tab 里通常只有一个 Nuxt app。

流程是：

```txt
浏览器加载 Nuxt
  ↓
创建 Nuxt app
  ↓
执行 app/plugins/api.ts
  ↓
注入 $api
  ↓
页面、组件、store 都通过 useNuxtApp().$api 复用
```

只要不整页刷新，页面跳转不会重新创建整个 Nuxt app，所以 `$api` 可以复用。

## 10. 服务端为什么每个 SSR 请求要有自己的 `$api`

服务端是同一个 Node/Nitro 进程服务很多用户。用户 A 和用户 B 的请求可能同时在一个进程里执行。

SSR 阶段如果要请求 `/api/auth/me`，必须带当前浏览器请求的 cookie：

```txt
A 浏览器
  Cookie: session=A
  ↓
A 的 SSR
  ↓
请求真实后端或 BFF
  Cookie: session=A
```

B 用户也必须是：

```txt
B 浏览器
  Cookie: session=B
  ↓
B 的 SSR
  ↓
请求真实后端或 BFF
  Cookie: session=B
```

所以 `$api` 里如果保存用户 cookie，就必须是当前 SSR 请求自己的，不能是服务端全局共享的。

## 11. 什么是 `baseFetch + wrapper`

现在采用两层设计：

```txt
baseFetch
  进程级复用
  只保存 baseURL、timeout、retry、错误处理
  不保存 cookie

当前 SSR 请求的 $api wrapper
  每个 SSR 请求创建一份
  保存当前请求 cookie / x-request-id
  调用 baseFetch 时临时合并进 headers
```

换句话说：

```txt
baseFetch 负责怎么请求
wrapper 负责代表谁请求
```

这样既减少重复创建完整 `$fetch` 实例的成本，又不会把 A 用户的身份带给 B 用户。

## 12. 为什么服务端全局保存 cookie 会出事故

错误示意：

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

可能发生：

```txt
A 请求进来，currentCookie = A 的 cookie
B 请求进来，currentCookie = B 的 cookie
A 的 SSR 还没结束，又发接口请求
读取 currentCookie 时，可能已经变成 B 的 cookie
```

后果很严重：

- B 看到 A 的个人资料
- B 看到 A 的购物车
- B 看到 A 的订单
- B 的写操作写到 A 的账号下
- 日志、审计、风控身份混乱

这不是普通 bug，而是用户身份串号和隐私泄露。

## 13. BFF 转发 cookie 的正确理解

BFF 层在 SSR 或服务端接口请求真实后端时，是在“代替当前浏览器用户”发请求。

因此这三者必须一一对应：

```txt
当前浏览器用户
  ↔
当前 SSR / BFF request
  ↔
转发给真实后端的 cookie
```

可以全局复用 HTTP 能力，但不能全局复用用户身份凭证。

## 14. 为什么有两个 cookie

`nuxt_pilot_session`

真正的登录凭证：

- `httpOnly: true`
- JS 读不到
- 后端用它识别用户身份，当前实现是 backend HMAC 签名 token
- 不能暴露给前端
- 不依赖 backend 进程内存 Map，刷新、热更新或多实例时不会因为内存 session 丢失而天然失效

`nuxt_pilot_logged_in`

前端可读的登录提示位：

- `httpOnly: false`
- JS 可以通过 `document.cookie` 只读判断
- 值只有 `1`
- 不代表真实身份
- 只用于判断是否需要调用 `/api/auth/me` 尝试恢复登录态

即使用户手动把 `nuxt_pilot_logged_in` 改成 `1`，也不能伪造登录。真正鉴权仍然依赖 `nuxt_pilot_session`。

## 15. 为什么两个 cookie 过期时间曾经看起来不一样

服务端登录接口原本给两个 cookie 都设置了 7 天。

但前端 store 里又执行了：

```ts
const loggedInHint = useCookie('nuxt_pilot_logged_in')
loggedInHint.value = '1'
```

`useCookie()` 如果不传 `maxAge`，前端重新写 cookie 时会把它覆盖成 Session Cookie。Nuxt 默认编码字符串，所以浏览器 里还会看到 `%221%22`，也就是编码后的 `"1"`。

修复方案：

- 抽出 `shared/constants/auth.ts`，统一 cookie 名称和过期时间
- `nuxt_pilot_logged_in` 只由真实后端创建和删除
- 前端只通过 `hasLoggedInHintCookie()` 做浏览器只读判断，不再使用 Nuxt `useCookie()` 写这个 cookie
- 兼容历史遗留的 `%221%22`，避免旧值被误判为空值后又被前端同步删除

## 16. 当前落地文件

核心架构文件：

- `app/plugins/api.ts`
- `app/utils/api-client.ts`
- `app/utils/auth-cookie.ts`
- `app/composables/useApiClient.ts`
- `app/composables/useApiQuery.ts`
- `app/composables/useQueryDrivenList.ts`
- `app/stores/session.ts`
- `backend/app.mjs`
- `backend/services/session-service.mjs`
- `server/utils/api-response.ts`
- `server/utils/upstream.ts`
- `shared/constants/auth.ts`
- `shared/types/api.ts`

配套文档：

- `docs/nuxt-architecture.md`
- `docs/api-architecture.md`
- `docs/nuxt-qa-digest.md`

## 17. 最终原则

Nuxt 中大型项目里要记住几条边界：

- 页面不要直接理解真实后端，经过 BFF
- 普通 SSR 页面用 `useApiQuery`
- URL query 驱动的复杂列表用 `useQueryDrivenList`
- 用户操作请求用 `useApiClient`
- 服务端可以全局复用无状态能力
- cookie、token、当前用户信息必须绑定当前请求
- SSR 数据和客户端 hydration 状态必须使用同一套条件
- 公共页面不要无条件请求 `/api/auth/me`
- 真正的登录凭证必须 `httpOnly`
- 前端可读 cookie 只能做提示，不能做鉴权
