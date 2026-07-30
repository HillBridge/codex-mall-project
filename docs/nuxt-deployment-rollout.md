# Nuxt Deployment 版本切换、回滚与灰度策略

## Q: 这个项目的 Nuxt 部分如何部署到 Cloudflare？

A: 这个项目的 Nuxt 部分应该按 SSR 应用部署，不建议只做纯静态生成。

原因是项目里不只有页面和静态资源，还有：

```txt
server/api/* BFF 接口
server/middleware/*
SSR 首屏数据请求
Cookie 鉴权和登录态恢复
routeRules 缓存策略
```

推荐部署到 Cloudflare Pages，使用 Nuxt/Nitro 的 Cloudflare Pages preset。

Cloudflare Pages 构建配置可以是：

```txt
Framework preset: Nuxt
Build command: pnpm exec nuxi build --preset=cloudflare_pages
Build output directory: dist
Root directory: /
```

环境变量建议：

```txt
NODE_VERSION=22
PNPM_VERSION=11.7.0
NUXT_PUBLIC_SITE_URL=https://your-domain.com
NUXT_PUBLIC_API_BASE=/api
NUXT_API_BASE_INTERNAL=https://api.your-domain.com
BFF_SERVICE_ID=nuxt-bff
BFF_SERVICE_TOKEN=replace-with-secret-token
BFF_SERVICE_SIGNATURE_SECRET=replace-with-signature-secret
```

注意：部署到 Cloudflare 以后，Nuxt BFF 运行在 Cloudflare 边缘节点里，不能再通过 `http://127.0.0.1:4000` 访问 Koa。Koa 后端必须单独部署成 Cloudflare 可访问的 HTTPS 服务，或者放在可以被 Cloudflare 安全访问的私有网络方案后面。

## Q: 前端和 BFF 层是不是部署到同一个域名里？

A: 是。这个项目推荐把 Nuxt 页面和 Nuxt BFF 放在同一个公开域名下。

例如：

```txt
https://www.your-domain.com/              -> Nuxt 页面
https://www.your-domain.com/products      -> Nuxt SSR 页面
https://www.your-domain.com/api/products  -> Nuxt BFF 接口
https://www.your-domain.com/api/auth/me   -> Nuxt BFF 接口
```

浏览器只访问 `www.your-domain.com`，前端请求也继续使用：

```txt
NUXT_PUBLIC_API_BASE=/api
```

然后 Nuxt BFF 在服务端再去请求真实 Koa 后端：

```txt
Nuxt BFF -> https://api.your-domain.com/products
Nuxt BFF -> https://api.your-domain.com/auth/me
```

这样可以避免浏览器跨域问题，Cookie 同域处理也更简单。Koa 后端不建议作为浏览器公开 API 直接暴露，而是通过服务间 token 和签名只接受 Nuxt BFF 的调用。

## Q: Nuxt 的 deployment 到底包含什么？

A: 在这个项目里，Nuxt deployment 不是单纯的前端静态文件，而是一个完整的前端与 BFF 服务版本。

它包含：

```txt
页面 SSR 逻辑
app/pages/*
server/api/* BFF 接口
server/middleware/*
运行时配置
打包后的 JS/CSS 静态资源
```

因此每次重新打包部署，实际发布的是一个新的 Nuxt 前端 + BFF 服务版本。

## Q: Cloudflare Pages 里的 Pages 是什么？

A: Pages 指 Cloudflare Pages，是 Cloudflare 提供的应用托管平台。

对这个项目来说，它托管的不只是静态页面，还包括 Nuxt SSR 和 Nuxt `server/api/*` BFF 层。部署后，生产域名会指向某一个成功构建出来的 deployment。

可以简单理解为：

```txt
Cloudflare Pages project
  -> production domain
  -> current production deployment
```

每次构建成功后，Cloudflare 会生成一个新的 deployment。生产域名可以指向最新 deployment，也可以回滚到以前的 production deployment。

## Q: 原子是什么意思？

A: 原子是工程里的说法，意思是一个操作要么完整成功，要么完全不发生，不会停在半截状态。

非原子部署可能出现：

```txt
旧文件正在被覆盖
新文件只上传了一半
服务正在重启
用户刚好访问
页面拿到一半旧资源、一半新资源
```

原子部署希望避免这种半成品状态。线上用户看到的应该是完整旧版本，或者完整新版本，而不是一个夹在中间的临时状态。

## Q: 版本切换是什么？

A: 每次构建会产生一个不可变版本。

```txt
Deployment A
  HTML/SSR server bundle
  /api BFF server bundle
  _nuxt/*.js
  _nuxt/*.css

Deployment B
  新 HTML/SSR server bundle
  新 /api BFF server bundle
  新 _nuxt/*.js
  新 _nuxt/*.css
```

Cloudflare Pages 的常规发布模式是：

```txt
旧版本 A 正在服务生产流量
新版本 B 在后台构建
B 构建成功
生产域名从 A 切到 B
```

这叫原子切换。它不是一边覆盖旧文件一边服务用户，而是先准备好一个完整的新 deployment，再把生产指针切过去。

换成域名视角就是：

```txt
切换前：
www.example.com -> Deployment A

切换后：
www.example.com -> Deployment B
```

所以正常情况下不会出现：

```txt
构建到一半，线上文件缺失
```

而是：

```txt
切换前：100% A
切换后：100% B
```

Cloudflare Pages 支持把生产环境回滚到之前成功构建过的 production deployment。参考：<https://developers.cloudflare.com/pages/configuration/rollbacks/>

## Q: 原子切换是不是灰度发布？

A: 不是。

Cloudflare Pages 的常规生产发布更接近：

```txt
100% old -> 100% new
```

也就是新版本构建成功后，生产域名一次性切到新 deployment。

灰度发布则是：

```txt
95% old + 5% new
80% old + 20% new
50% old + 50% new
0% old + 100% new
```

Cloudflare Pages 适合“预览部署、验收、生产原子切换、快速回滚”。如果需要真正按比例逐步放量，更适合 Cloudflare Workers Gradual Deployments。

## Q: 切换过程中可能出问题的地方在哪里？

A: deployment 本身是原子的，但用户请求不是原子的。

例如：

```txt
用户打开页面时拿到的是 A 版本 HTML
过了 10 秒，生产环境切到 B
用户继续点击页面，浏览器请求 JS、CSS 或 /api
```

这时可能出现：

```txt
HTML 来自 A
JS/CSS 请求进入 B
/api 请求进入 B
BFF 再去调用 Koa
```

这类问题叫 version skew，也就是新旧版本交叉。Cloudflare Workers 文档里也提到，渐进发布时同一个用户的连续请求可能命中不同版本，需要 version affinity 解决。参考：<https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/>

所以发布稳定性的核心不是完全消灭新旧共存，而是让新旧共存时也安全。

## Q: Nuxt 的 BFF 层也是后端服务，为什么不是自己多实例部署？

A: Nuxt 的 BFF 层确实是后端服务。区别在于部署位置不同，多实例由谁负责也不同。

如果部署在传统服务器上，通常需要自己管理 Nuxt 多实例：

```txt
Nginx
  -> Nuxt instance A
  -> Nuxt instance B
  -> Nuxt instance C
```

这时要自己处理：

```txt
启动几个进程
健康检查
负载均衡
滚动重启
实例挂了怎么摘除
```

如果部署到 Cloudflare Pages 或 Workers，Nuxt SSR/BFF 代码运行在 Cloudflare 边缘平台上。多实例、调度、扩缩容和故障摘除由 Cloudflare 托管。

所以不是 Nuxt BFF 没有多实例，而是：

```txt
传统服务器：自己部署和管理多实例
Cloudflare：平台托管多实例
```

但 BFF 既然后端化了，就必须按后端服务的要求设计：

```txt
BFF 不保存进程内用户状态
Cookie/session 密钥新旧版本保持一致
BFF 到 Koa 的接口保持发布窗口内兼容
日志和 traceId 能追踪 BFF 到 Koa 的链路
出问题可以回滚
```

## Q: Nuxt 层怎么保证安全切换？

A: 第一，BFF 层必须无状态。

不要在 Nuxt 进程内存里保存用户登录态、购物车、临时订单、验证码状态等数据。Cloudflare 边缘实例很多，新旧版本也可能在短时间内同时存在。

推荐方式：

```txt
登录态：Cookie / 后端 session / JWT
业务状态：数据库 / Redis / KV / 后端服务
BFF：只做校验、转发、聚合、响应格式统一
```

当前项目的方向是：浏览器请求 `/api/*`，Nuxt BFF 再转发给 Koa。

第二，Cookie 和密钥不能随版本乱变。

这些环境变量在新旧版本切换期间要保持一致：

```txt
NUXT_SESSION_SECRET
BFF_SERVICE_ID
BFF_SERVICE_TOKEN
BFF_SERVICE_SIGNATURE_SECRET
BACKEND_SERVICE_TOKEN
BACKEND_SERVICE_SIGNATURE_SECRET
BACKEND_SESSION_SECRET
```

否则可能出现：

```txt
旧版本签的 cookie，新版本不认
新版本 BFF 调 Koa，Koa 鉴权失败
用户突然掉登录
/api 大量 403
```

第三，接口要向后兼容。

发布期间可能出现这些组合：

```txt
旧 Nuxt BFF -> 旧 Koa
新 Nuxt BFF -> 旧 Koa
旧 Nuxt BFF -> 新 Koa
新 Nuxt BFF -> 新 Koa
```

稳定的系统要让这些组合在发布窗口内都能工作。

接口变更建议：

```txt
可以新增字段
不要立刻删除字段
不要立刻改字段含义
不要立刻改错误码语义
新参数最好有默认值
旧客户端不传新参数时仍然可用
```

## Q: 回滚怎么做？

A: Nuxt 回滚流程通常是：

```txt
发现 B 有问题
在 Cloudflare Pages 中选择之前的 production deployment A
Rollback
生产域名重新指向 A
```

但要注意：回滚代码不等于回滚一切。

这些内容不会自动回滚：

```txt
数据库结构
后端 Koa 版本
环境变量
第三方配置
缓存内容
用户已经写入的新数据
```

所以发布设计里很重要的一条是：

```txt
数据库和接口迁移要支持回滚窗口
```

例如不要这样：

```txt
先删除 old_name 字段
再发布新 Nuxt
```

应该这样：

```txt
第 1 次发布：新增 new_name，old_name 继续保留
第 2 次发布：Nuxt 改用 new_name
观察稳定
第 3 次发布：再删除 old_name
```

## Q: 灰度发布怎么做？

A: Cloudflare Pages 默认更偏向：

```txt
预览部署 -> 验收 -> 生产原子切换 -> 可回滚
```

它适合大多数项目，但不是天然的百分比灰度。

如果要做到：

```txt
5% 用户用新版
95% 用户用旧版

然后：
20%
50%
100%
```

更适合使用 Cloudflare Workers Gradual Deployments。

Workers 支持上传新版本后，按比例部署流量：

```txt
Version A: 95%
Version B: 5%
```

然后逐步调整：

```txt
A 80% / B 20%
A 50% / B 50%
A 0%  / B 100%
```

参考：<https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/>

## Q: 灰度时为什么要 version affinity？

A: 如果没有 version affinity，同一个用户的每个请求可能独立抽签。

```txt
请求 HTML -> 命中 A
请求 JS   -> 命中 B
请求 /api -> 命中 A
刷新页面 -> 命中 B
```

这对 Nuxt 很危险，因为 Nuxt 静态资源通常使用 hash 文件名：

```txt
A: _nuxt/page.aaa111.js
B: _nuxt/page.bbb222.js
```

如果 HTML 来自 A，却去 B 版本里找 `page.aaa111.js`，就可能 404。

灰度发布时要用一个稳定 key 把用户固定到同一个版本。

常见 key：

```txt
已登录用户：user_id
有 session：session id
匿名用户：长期 cookie
兜底：IP 地址
```

Cloudflare Workers 可以通过 `Cloudflare-Workers-Version-Key` 请求头做 version affinity。

## Q: version affinity 的 key 是不是每次发版本时生成的版本 key？

A: 不是。这个 key 的含义更接近“用户或会话的稳定标识”，而不是“版本标识”。

不推荐理解成：

```txt
发布 B 版本 -> 生成 version_key=B
用户带着 B 去找 B 版本资源
```

更准确的理解是：

```txt
用户有一个稳定标识：user_id / session_id / anonymous_id
Cloudflare 用这个稳定标识做 hash
再根据当前灰度比例决定这个用户命中哪个版本
```

例如当前灰度比例是：

```txt
old: 90%
new: 10%
```

用户请求带上：

```txt
Cloudflare-Workers-Version-Key: user_123
```

Cloudflare 内部会根据这个 key 做稳定分桶：

```txt
hash(user_123) -> 落在 new 的 10% 桶里
```

于是这个用户稳定命中新版本。另一个用户：

```txt
Cloudflare-Workers-Version-Key: user_456
```

可能落在旧版本的 90% 桶里，于是稳定命中旧版本。

关键点是：

```txt
这个 key 不直接对应某个版本
这个 key 只是用于稳定分桶
真正决定命中新旧版本的是当前灰度比例 + Cloudflare 的分桶算法
```

推荐流程：

```txt
1. 用户第一次访问时，如果没有稳定 key，应用或边缘规则生成一个 anonymous_id/session_id cookie
2. 后续请求都会带上这个 cookie
3. Cloudflare Transform Rule 把 cookie 值写入 Cloudflare-Workers-Version-Key header
4. Workers Gradual Deployments 用这个 header 做稳定分桶
5. 同一用户在灰度期间稳定命中同一个版本
```

例如浏览器携带：

```txt
Cookie: release_affinity_id=abc123
```

Cloudflare 转成：

```txt
Cloudflare-Workers-Version-Key: abc123
```

然后 Cloudflare 决定它命中 old 还是 new。

## Q: 灰度发布期间是不是新旧两个服务版本共存？

A: 是。只要灰度还没有推进到 100% 新版本，生产环境里就会有新旧两个版本同时服务流量。

例如：

```txt
old: 90%
new: 10%
```

这时就是旧 Nuxt/BFF deployment 和新 Nuxt/BFF deployment 同时存在，并且都在处理生产请求。

用户携带的稳定 key，例如：

```txt
release_affinity_id=abc123
```

Cloudflare 会把它作为版本亲和 key：

```txt
Cloudflare-Workers-Version-Key: abc123
```

然后 Cloudflare 根据当前灰度比例做稳定分桶：

```txt
abc123 -> old
xyz789 -> new
```

之后同一个用户继续请求这些资源或接口时：

```txt
/
/products
/_nuxt/*.js
/_nuxt/*.css
/api/products
/api/auth/me
```

都会尽量稳定命中同一个版本，避免出现 HTML 来自旧版本、JS 却去新版本找的错位问题。

需要注意两点：

```txt
用户 key 不指定版本，只是分桶依据
真正决定命中新旧版本的是当前灰度比例 + Cloudflare 的 hash 分桶
```

当灰度比例继续推进时，一部分原本在旧版本的用户会被纳入新版本。

例如：

```txt
10% 灰度：
user_a -> new
user_b -> old
user_c -> old

30% 灰度：
user_a -> new
user_b -> new
user_c -> old
```

已经进入新版本的用户通常不会再跳回旧版本，除非回滚或改变部署策略。

## Q: 灰度百分比是不是用户切到新服务的数量？

A: 基本可以这么理解，但要分有没有 version affinity。

没有 version affinity 时：

```txt
new: 10%
```

表示大约 10% 的请求会进入新版本。同一个用户的多次请求可能有的进旧版本，有的进新版本。

有 version affinity 时：

```txt
new: 10%
```

就更接近“大约 10% 的用户或会话稳定切到新版本”。

例如：

```txt
old: 90%
new: 10%
```

Cloudflare 根据用户稳定 key 做分桶：

```txt
user_a -> new
user_b -> old
user_c -> old
```

落到 new 桶里的用户，后续请求都会尽量走新版本。

但这仍然不是精确人数，不是 10000 个用户一定正好 1000 个去新版。它更像哈希分桶后的近似比例：

```txt
用户量越大，越接近配置的百分比
用户量很小，偏差可能明显
```

所以结论是：

```txt
没有 version affinity：灰度百分比约等于请求比例
有 version affinity：灰度百分比约等于用户/会话比例
```

如果关心“多少用户切到新服务”，就应该配置 version affinity。

## Q: 可不可以不做百分比灰度，而是让旧登录会话继续使用旧版本，新会话直接使用新版本？

A: 可以。这种方式不是百分比灰度，而是“按会话排空切换”。

```txt
发布前已经在使用系统的会话 -> 继续使用旧版本 A
发布后的新访客、新会话     -> 直接使用新版本 B
旧用户退出或会话过期       -> 下次进入新版本 B
```

它解决的核心问题是：用户在登录、填表、支付或其他连续操作过程中，不会突然从 A 切换到 B。

推荐把登录 Cookie 和版本绑定 Cookie 分开：

```txt
session              -> 表示登录身份，由 Nuxt/Koa 验证
app_release=release-a -> 只表示这次会话绑定版本 A
```

刷新浏览器不会清除 Cookie。只有退出登录时主动删除、Cookie 到期或用户手动清除后，版本绑定才会消失。

版本绑定必须有最长有效期，例如 8 小时或 24 小时，不能让旧版本无限保留。过期后用户进入当前稳定版本。

## Q: Worker 怎么根据版本 Cookie 把请求转发到两个 Pages 部署？

A: 每次 Pages 部署都会有一个固定的 hash 地址，例如：

```txt
旧版本 A：https://a1b2c3.my-nuxt.pages.dev
新版本 B：https://d4e5f6.my-nuxt.pages.dev
```

正式域名不直接指向某一个 Pages deployment，而是先进入一个入口 Worker：

```txt
浏览器访问 https://www.example.com
                 |
                 v
          入口 Worker 读取 Cookie
                 |
       +---------+---------+
       |                   |
app_release=release-a   其他情况
       |                   |
       v                   v
旧 Pages deployment A  新 Pages deployment B
```

入口 Worker 只负责版本路由，不负责登录鉴权。真正的身份和权限仍由 Nuxt BFF/Koa 校验。

Worker 的核心代码可以写成：

```ts
interface Env {
  OLD_ORIGIN: string
  NEW_ORIGIN: string
  OLD_RELEASE: string
  NEW_RELEASE: string
}

const RELEASE_COOKIE = 'app_release'

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie') ?? ''

  for (const item of cookieHeader.split(';')) {
    const [key, ...valueParts] = item.trim().split('=')

    if (key === name) {
      return decodeURIComponent(valueParts.join('='))
    }
  }

  return null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const release = readCookie(request, RELEASE_COOKIE)
    const useOldVersion = release === env.OLD_RELEASE
    const origin = useOldVersion ? env.OLD_ORIGIN : env.NEW_ORIGIN

    const incomingUrl = new URL(request.url)
    const targetUrl = new URL(
      incomingUrl.pathname + incomingUrl.search,
      origin,
    )

    const headers = new Headers(request.headers)
    headers.set('X-Forwarded-Host', incomingUrl.host)
    headers.set('X-Forwarded-Proto', incomingUrl.protocol.slice(0, -1))

    const upstreamResponse = await fetch(
      new Request(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      }),
    )

    const response = new Response(upstreamResponse.body, upstreamResponse)

    if (!release) {
      response.headers.append(
        'Set-Cookie',
        `${RELEASE_COOKIE}=${encodeURIComponent(env.NEW_RELEASE)}; ` +
          'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800',
      )
    }

    response.headers.set(
      'X-App-Release',
      useOldVersion ? env.OLD_RELEASE : env.NEW_RELEASE,
    )

    return response
  },
}
```

Worker 环境变量示例：

```txt
OLD_ORIGIN=https://a1b2c3.my-nuxt.pages.dev
NEW_ORIGIN=https://d4e5f6.my-nuxt.pages.dev
OLD_RELEASE=release-a
NEW_RELEASE=release-b
```

代码只能从预先配置的 A、B 地址中选择，不能直接把 Cookie 内容当作目标网址，否则会带来安全风险。

参考：

- Pages 固定部署地址：<https://developers.cloudflare.com/pages/configuration/preview-deployments/>
- Worker 路由与域名：<https://developers.cloudflare.com/workers/configuration/routing/>
- Worker Fetch API：<https://developers.cloudflare.com/workers/runtime-apis/fetch/>

## Q: 上线入口 Worker 之前，已经登录但没有版本 Cookie 的用户怎么办？

A: 需要一个过渡判断，否则这些用户会因为没有 `app_release` 而直接进入 B。

过渡期规则可以是：

```txt
有 app_release=release-a       -> A
有 app_release=release-b       -> B
没有 app_release，但有 session -> A，并补发 release-a
两种 Cookie 都没有             -> B，并下发 release-b
```

这里检查 `session` 是否存在只用于选择版本，不代表登录一定有效。过期、伪造或无效 session 最终仍应由 Nuxt BFF/Koa 拒绝。

更稳妥的发布顺序是：

```txt
1. 当前只有 A 时，先上线入口 Worker
2. 给当前活跃用户下发 app_release=release-a
3. 构建并验证 Pages deployment B
4. 把“无版本 Cookie”的默认目标改成 B
5. A、B 同时保留，等待旧会话退出或过期
6. 确认 A 已经没有有效流量
7. 删除 A 路由并让 B 成为唯一版本
```

如果无法提前执行第 1、2 步，就临时使用“有 session 但没有版本 Cookie时进入 A”的兼容规则。

## Q: 退出登录后怎么让旧用户进入新版本？

A: 退出接口成功后，同时删除登录 Cookie 和版本绑定 Cookie：

```http
Set-Cookie: app_release=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax
```

用户下次访问时没有版本绑定，入口 Worker 会把他分配到当前稳定版本 B，并下发：

```txt
app_release=release-b
```

如果用户一直不退出，`app_release` 的 `Max-Age` 会作为最终排空期限。到期后不要继续把他送回已经下线的 A。

## Q: 为什么页面、BFF 和静态资源必须一起按版本转发？

A: A 返回的 HTML 通常引用 A 构建出来的带 hash 文件：

```txt
A HTML -> /_nuxt/page.aaa111.js
B HTML -> /_nuxt/page.bbb222.js
```

如果只有页面走 A，而 `/_nuxt/*` 或 `/api/*` 走 B，就可能出现：

```txt
HTML 来自 A
JS/CSS 去 B 查找 -> 404
BFF 请求进入 B   -> 前后行为不一致
```

因此 `app_release` 必须使用 `Path=/`，并让入口 Worker 处理整个正式域名：

```txt
/
/products
/_nuxt/*
/api/*
```

旧 deployment 仍有流量时不能删除。Nuxt 中的公开站点地址也应始终配置为正式域名：

```txt
NUXT_PUBLIC_SITE_URL=https://www.example.com
```

这样登录回调和页面跳转不会暴露内部的 `pages.dev` 地址。

按会话排空只能保证同一会话的 Nuxt 版本稳定。A、B 共存期间，它们仍然会调用同一个 Koa 服务，所以 Koa API、数据库结构、Cookie 密钥和服务间签名必须同时兼容 A、B。

## Q: 这个项目推荐怎么发布？

A: 如果当前目标是稳定上线，而不是复杂灰度，推荐：

```txt
Cloudflare Pages 部署 Nuxt/BFF
Koa 独立多实例部署
先发 Koa 兼容版本
再发 Nuxt preview
验收 preview
合并到生产
Cloudflare 原子切换
出问题 rollback
```

如果后续要更专业的灰度，推荐：

```txt
Nuxt/BFF 改成 Cloudflare Workers 发布模型
使用 Workers Gradual Deployments
配置 version affinity
按 5% -> 20% -> 50% -> 100% 推进
监控 5xx、404、接口错误、登录失败率、核心转化
异常时立刻回滚到旧版本
```

## Q: 一条实际发布流水线可以怎么设计？

A: 可以按下面的流程：

```txt
1. 本地/CI 运行 lint、typecheck、build
2. 创建 Cloudflare preview deployment
3. 跑 smoke test：
   - 首页能打开
   - 商品列表能打开
   - 登录成功
   - /api/auth/me 正常
   - /api/products 正常
4. 先部署兼容版 Koa
5. 再发布 Nuxt production
6. 观察 10-30 分钟：
   - 5xx 是否上升
   - 404 是否上升
   - 登录失败是否上升
   - Koa 403 是否上升
7. 稳定后完成发布
8. 异常则 rollback Nuxt，必要时 rollback Koa
```

## 总结

Nuxt deployment 的切换靠不可变构建和生产指针切换，回滚靠旧 production deployment，百分比灰度靠 Workers Gradual Deployments + version affinity。

如果不做百分比灰度，也可以通过入口 Worker + `app_release` Cookie 实现按会话排空：

```txt
旧会话继续使用 A
新会话直接使用 B
旧会话退出或过期后进入 B
确认 A 没有流量后下线 A
```

真正让用户无感的核心是：

```txt
BFF 无状态
密钥稳定
接口兼容
后端先兼容发布
静态资源避免版本错位
异常时可以快速回滚
```
