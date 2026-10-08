# Nuxt Pilot 项目架构与功能分析

## 1. 项目定位

本项目是一个以 **Nuxt 4 SSR 为前端运行时、Nitro Server API 为 BFF、独立 Koa 服务为后端** 的全栈电商演示项目。

项目重点不是实现完整电商业务，而是演示 Nuxt 在中大型 C 端项目中的工程能力：

- SSR 服务端渲染
- SSR/CSR 数据一致性
- BFF 接口层
- Cookie 会话认证
- CSRF 防护
- 路由级缓存
- SEO
- 前后端共享类型
- 错误边界和链路追踪
- 按业务域拆分前端代码

整体请求链路如下：

```text
浏览器
  ↓
Nuxt 页面 / 组件
  ↓
composables / Pinia store
  ↓
Nuxt Nitro BFF：/api/*
  ↓
Koa Backend：127.0.0.1:4000
  ↓
backend/data 中的静态演示数据
```

浏览器不会直接访问 Koa 后端，而是统一访问 Nuxt 的 `/api` 接口。

---

## 2. 技术栈与运行方式

### 2.1 主要技术栈

- Nuxt 4
- Vue 3
- TypeScript，开启 strict 模式
- Nitro / H3
- Pinia
- VueUse
- Koa 3
- `@koa/router`
- Zod
- `lucide-vue-next`
- ESLint 9
- Prettier

主要配置文件：

- `package.json`
- `nuxt.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`

### 2.2 本地运行

项目需要启动 Nuxt 和 Koa 两个进程：

```bash
pnpm install
pnpm backend
pnpm dev
```

默认地址：

- Nuxt 前端：`http://localhost:3000`
- Koa 后端：`http://127.0.0.1:4000`

默认演示账号：

```text
邮箱：demo@example.com
密码：nuxt-demo
```

### 2.3 常用命令

```bash
pnpm dev          # 启动 Nuxt 开发服务器
pnpm backend      # 启动 Koa 后端
pnpm build        # 构建 Nuxt
pnpm start:nuxt   # 启动生产版 Nuxt
pnpm start:backend # 启动生产版 Koa 后端
pnpm typecheck    # TypeScript 类型检查
pnpm lint         # ESLint 检查
pnpm quality      # lint + typecheck + format 检查
```

---

## 3. 目录架构

### 3.1 `app/`：Nuxt 前端源码

```text
app/
├── components/       通用组件、应用壳、错误边界、消息提示
├── composables/      API、SSR 数据、SEO、列表等组合函数
├── features/         按业务域拆分的功能模块
├── layouts/          页面布局
├── middleware/       路由中间件
├── pages/            文件路由页面
├── stores/           Pinia 状态管理
├── utils/            API 错误、格式化等工具
└── assets/css/       全局样式
```

当前主要业务模块是：

```text
app/features/products/
```

该模块包含商品相关组件、composable 和类型。

### 3.2 `server/`：Nuxt Nitro BFF

```text
server/
├── api/
│   ├── auth/
│   └── products/
├── middleware/
└── utils/
```

主要职责：

- 接收前端 `/api` 请求
- 转发到 Koa 后端
- 处理 Cookie
- 转发 CSRF 和 request ID
- 添加 BFF 服务认证签名
- 统一处理后端错误
- 标准化 API 响应
- 转发后端 `Set-Cookie`

核心文件：

- `server/api/products/index.get.ts`
- `server/api/products/[slug].get.ts`
- `server/api/auth/login.post.ts`
- `server/api/auth/me.get.ts`
- `server/api/auth/logout.post.ts`
- `server/utils/upstream.ts`
- `server/utils/api-response.ts`

### 3.3 `backend/`：独立 Koa 后端

```text
backend/
├── app.mjs
├── server.mjs
├── data/
│   ├── products.mjs
│   └── users.mjs
├── services/
│   └── session-service.mjs
└── utils/
```

这是实际提供商品和认证接口的后端服务。

当前数据保存在内存中的静态数组中，没有数据库。

### 3.4 `shared/`：前后端共享契约

```text
shared/
├── types/
│   ├── api.ts
│   ├── product.ts
│   └── user.ts
└── constants/
    ├── auth.ts
    └── service-auth.ts
```

共享类型包括：

- `ProductSummary`
- `ProductDetail`
- `UserProfile`
- `ApiSuccess<T>`
- `ApiFailure`
- `ApiClientError`
- `ApiRouteMap`

该层只放前后端都可以使用的纯类型和常量，不放浏览器或服务端运行时逻辑。

### 3.5 其他目录

- `docs/`：架构、API 和代码质量说明
- `public/`：静态资源
- `scripts/`：质量检查和 Git hook 脚本
- `test/`：当前已有的策略类测试
- `.nuxt/`、`.output/`：Nuxt 生成产物，不属于业务源码
- `node_modules/`、`.pnpm-store/`：依赖相关目录

---

## 4. 页面路由与功能

### 4.1 首页 `/`

文件：

```text
app/pages/index.vue
```

已实现：

- 品牌 Hero 区域
- 推荐商品展示
- 首页 SSR 数据获取
- 商品卡片跳转
- SEO 标题和描述
- 错误状态和重新加载

首页通过 `useApiQuery('/products', { featured: true })` 请求推荐商品，后端根据 `featured` 字段过滤数据。

### 4.2 商品列表 `/products`

文件：

```text
app/pages/products/index.vue
```

已实现：

- 商品网格展示
- 关键词搜索
- 分类筛选
- URL Query 同步
- SSR 首屏加载
- 客户端筛选刷新
- 搜索输入防抖
- 空结果状态
- 加载状态
- 错误状态
- 失败重试
- 商品详情跳转

当前分类：

```text
全部
家居
户外
数码
穿搭
```

筛选条件通过 URL 保存，例如：

```text
/products?q=desk&category=家居
```

搜索会匹配以下字段：

- 商品名称
- 系列
- 分类
- 商品摘要

列表页使用 `app/composables/useQueryDrivenList.ts`，用于处理：

- SSR 首屏数据复用
- URL 查询变化后的重新请求
- 请求竞态处理
- 防止旧请求覆盖新请求
- 筛选条件签名缓存

搜索输入配置：

- `250ms` debounce
- `1000ms` maxWait

### 4.3 商品详情 `/products/:slug`

文件：

```text
app/pages/products/[slug].vue
```

已实现：

- 商品图片
- 商品名称
- 分类
- 系列
- 描述
- 价格
- 库存
- 商品卖点
- 动态 SEO
- 商品不存在时返回 404
- 从商品卡片进入详情

详情数据比列表摘要更完整，包括：

```text
description
stock
highlights
```

### 4.4 登录 `/login`

文件：

```text
app/pages/login.vue
```

已实现：

- 邮箱和密码表单
- Zod 参数校验
- 登录错误提示
- 登录成功跳转
- 防止跳转到外部地址
- 默认演示账号填充

登录调用链：

```text
登录页面
  ↓
Pinia session store
  ↓
Nuxt /api/auth/login
  ↓
Koa /auth/login
  ↓
生成 Cookie Session
```

### 4.5 账户页 `/account/profile`

文件：

```text
app/pages/account/profile.vue
```

已实现：

- 登录保护
- 展示用户名
- 展示邮箱
- 展示会员等级
- 展示积分
- 展示用户偏好
- 未登录时跳转登录页
- 登录后支持 redirect 返回原页面

路由中间件为：

```text
app/middleware/auth.ts
```

访问账户页时会请求：

```text
GET /api/auth/me
```

未登录时跳转到：

```text
/login?redirect=/account/profile
```

---

## 5. 前后端数据流

### 5.1 前端 API 层

主要文件：

```text
app/plugins/api.ts
app/utils/api-client.ts
app/composables/useApiClient.ts
app/composables/useApiQuery.ts
```

页面只访问 Nuxt 的 `/api` 路径，例如：

```text
/api/products
/api/products/aero-desk
/api/auth/login
```

SSR 请求使用 `useRequestFetch`，可以继承当前请求中的：

- Cookie
- request ID
- 认证相关请求头

客户端请求使用统一 API Client，自动处理：

- `credentials: include`
- JSON 序列化
- CSRF Header
- 错误转换
- trace ID

### 5.2 BFF 转发层

`server/utils/upstream.ts` 负责：

- 拼接上游 URL
- 转发白名单 Cookie
- 转发 CSRF Header
- 写入 `x-request-id`
- 写入 `x-forwarded-host`
- 写入 `x-forwarded-proto`
- 添加服务间认证头
- 生成 HMAC 签名
- 设置请求超时
- 对可重试请求进行重试
- 转发后端 `Set-Cookie`
- 将上游错误映射为统一 API 错误

### 5.3 Koa 后端接口

文件：

```text
backend/app.mjs
```

当前接口：

```text
GET  /health
POST /auth/login
GET  /auth/me
POST /auth/logout
GET  /products
GET  /products/:slug
```

商品数据来自：

```text
backend/data/products.mjs
```

当前有 6 条演示商品数据。

商品列表接口支持：

```text
q
category
featured
```

后端会先进行 Zod 参数校验，再对内存数组执行过滤。

### 5.4 统一 API 响应

成功响应统一包装为：

```ts
{
  data: T,
  traceId: string
}
```

失败响应包含：

```ts
{
  code: ApiErrorCode,
  message: string,
  traceId?: string,
  details?: unknown
}
```

当前错误码包括：

```text
BAD_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
UPSTREAM_ERROR
INTERNAL_ERROR
```

---

## 6. 认证与安全能力

项目使用 Cookie 会话，而不是把 Token 存入 `localStorage`。

已实现：

- HttpOnly Session Cookie
- 登录态提示 Cookie
- CSRF Cookie
- CSRF Header 校验
- BFF 到后端的服务认证
- HMAC 服务请求签名
- 请求 ID
- Trace ID
- 安全响应头
- 同源和可信请求校验
- 统一错误码

会话实现位于：

```text
backend/services/session-service.mjs
```

后端会话是带过期时间的 HMAC 无状态 Token，不依赖进程内存 Map。

对于写请求，系统会经过两层安全检查：

1. Nuxt 服务端中间件检查可信请求、来源和 CSRF。
2. Koa 后端再次校验 CSRF 和服务间认证。

---

## 7. 缓存、SSR 与 SEO

`nuxt.config.ts` 配置了路由级缓存策略：

```text
/               SWR 120 秒
/products       SSR，no-store
/products/**    SWR 300 秒
/account/**     SSR
/api/**         no-store
```

设计意图：

- 首页允许短时间缓存
- 商品列表依赖搜索和分类，不使用页面缓存
- 商品详情允许短时间 SWR
- 账户页面保持 SSR 且不做公共缓存
- API 默认不缓存

SEO 统一通过：

```text
app/composables/usePageSeo.ts
```

实现，商品详情页可以根据商品内容动态设置：

- 页面标题
- 页面描述
- 分享图

---

## 8. 错误处理与用户体验

项目包含较完整的错误处理链路：

- `app/error.vue`：全局错误页
- `AppErrorBoundary`：客户端运行时错误边界
- `AppMessages`：全局消息提示
- `createApiErrorView`：将 API 错误转换为用户可读内容
- trace ID 展示：便于定位服务端问题
- 商品列表失败重试
- 商品详情不存在时返回 404
- 加载中的 Pending 状态
- 空数据 Empty State

---

## 9. 当前已实现的用户功能

综合来看，用户当前可以完成：

1. 访问首页并浏览推荐商品。
2. 进入商品目录浏览商品。
3. 按关键词搜索商品。
4. 按家居、户外、数码、穿搭等分类筛选商品。
5. 打开商品详情页，查看商品描述、价格、库存和卖点。
6. 使用演示账号登录。
7. 访问受保护的账户资料页。
8. 退出登录。
9. 在请求失败时查看错误提示并重试。
10. 在客户端和服务端环境中复用统一的数据请求与错误处理逻辑。

---

## 10. 当前尚未实现的能力

### 10.1 购物袋

商品卡片和详情页存在“加入购物袋”按钮或 `ShoppingBag` 图标，但目前没有真正的事件处理，也没有：

- 购物车 Store
- 商品数量修改
- 删除商品
- 购物车持久化
- 结算流程
- 订单接口
- 支付接口

### 10.2 收藏

商品卡片有 Heart 图标，但没有收藏状态和对应 API。

### 10.3 商品管理

当前没有：

- 商品新增
- 商品编辑
- 商品删除
- 库存扣减
- 价格更新
- 管理后台
- 分类元数据接口
- 分页
- 排序
- 商品写接口

### 10.4 数据库和真实业务后端

当前后端使用静态内存数据，不具备：

- 数据库持久化
- 多用户数据
- 真实库存
- 订单存储
- 数据一致性控制
- 商品搜索服务

### 10.5 认证仍是 Demo 级别

当前只有一个固定演示用户，密码直接位于演示数据中。

生产环境还需要进一步补充：

- 用户注册
- 密码哈希
- 密码重置
- 多用户存储
- Redis 或数据库 Session
- 更严格的密钥管理
- 登录限流
- 审计日志

### 10.6 环境变量配置仍需完善

代码实际使用了：

```text
BACKEND_SESSION_SECRET
BFF_SERVICE_ID
BFF_SERVICE_TOKEN
BFF_SERVICE_SIGNATURE_SECRET
```

生产部署时需要确认 `.env.example` 已覆盖所有必要配置，并且生产环境不使用代码中的本地默认密钥。

### 10.7 外部图片依赖

商品图片使用外部 Unsplash URL：

- 依赖外部网络可用性
- 没有本地图片回退
- 没有上传资源系统
- 生产环境需要考虑图片 CDN 和缓存

---

## 11. 项目成熟度判断

当前项目更像是一个展示 Nuxt SSR、BFF、认证、缓存和模块化实践的电商项目骨架。

已经完成了比较完整的：

- 页面路由
- 商品浏览
- 商品详情
- 登录认证
- 账户保护
- 服务端 API 转发
- 错误处理
- SEO
- 安全边界
- 基础质量规范

但还不是完整的电商系统，因为购物车、收藏、订单、支付、数据库、商品管理和真实用户体系尚未实现。

---

## 12. 验证结果

本次架构分析基于以下源码和文档：

- `package.json`
- `nuxt.config.ts`
- `README.md`
- `docs/nuxt-architecture.md`
- `app/pages/`
- `app/composables/`
- `app/features/products/`
- `server/api/`
- `server/utils/`
- `backend/app.mjs`
- `backend/services/`
- `backend/data/`
- `shared/types/`

已执行项目质量检查：

```bash
pnpm typecheck
pnpm lint
```

结果：

- TypeScript 类型检查通过
- ESLint 检查通过

当前测试目录包含：

```text
test/access-log-policy.test.ts
test/upstream-retry-policy.test.ts
```

但 `package.json` 当前没有提供统一的 `test` 脚本，因此尚未形成完整的自动化测试套件。
