# Cloudflare Pages 下 Vue SPA 发布后的旧资源与 MIME Type 问题

## 背景

当前场景是 Vue SPA 部署在 Cloudflare Pages 上。

发布新版本后，用户刷新浏览器，`index.html` 没有设置长期缓存，因此浏览器会重新请求生产域名上的最新入口页面。随后浏览器根据新的 `index.html` 继续请求 JS、CSS 等静态资源。

可能出现的问题是：

```txt
浏览器请求 /assets/a.js
Cloudflare CDN 缓存 MISS
Cloudflare Pages 当前 deployment 没有匹配到 /assets/a.js
Pages 的 SPA fallback 返回了 index.html
浏览器发现 JS 请求拿到的是 text/html
控制台报 MIME type 不匹配
页面白屏
```

典型浏览器错误类似：

```txt
Failed to load module script:
Expected a JavaScript module script but the server responded with a MIME type of "text/html".
```

## 这个过程理解是否正确

大方向是正确的，但需要注意一个细节：Cloudflare Pages 里的“源站”不是传统意义上的自建 origin server。

Pages 请求链路更接近：

```txt
Browser
  -> Cloudflare CDN
  -> Cloudflare Pages 当前 production deployment 的 asset store
```

当 CDN 层是 MISS 时，Cloudflare 会去当前 Pages deployment 的资源集合里查找这个路径。

如果当前 production deployment 中没有 `/assets/a.js`，Cloudflare Pages 就可能进入 SPA fallback 逻辑，把请求改写到 `/`，最终返回 `index.html`。

于是：

```txt
请求路径：/assets/a.js
响应状态：可能是 200
响应内容：index.html
响应类型：text/html
浏览器期望：application/javascript
结果：MIME type 不匹配，页面白屏
```

所以这不是浏览器误判，而是 JS 请求确实拿到了 HTML。

Cloudflare Pages 文档说明，如果项目没有顶层 `404.html`，Pages 会认为这是 SPA，并把未匹配路径交给根路径 `/`。参考：<https://developers.cloudflare.com/pages/configuration/serving-pages/>

## “源站里明明有 a.js”要如何理解

这里要确认的是：`a.js` 是否真的存在于 Cloudflare Pages 当前生产 deployment 的最终上传产物里，并且路径完全一致。

常见误差包括：

```txt
本地 dist 里有，但 Pages 实际构建产物里没有
Pages 的 output directory 配错
线上请求路径和实际路径不一致
Vite base 配置错误
文件大小写不一致
生产域名指向的是另一个 deployment
用户拿到的是旧 index.html，但生产 deployment 已经切到新资源集合
_redirects 规则过宽，把资源请求也改写到 index.html
Cloudflare Cache Rules 缓存了旧 HTML 或错误响应
```

尤其需要检查 `_redirects`。

如果存在：

```txt
/* /index.html 200
```

就要谨慎。这个规则可能把本该返回 404 的资源请求也改写成 `index.html`，从而让 JS 请求拿到 HTML。

Pages 自身已经有 SPA fallback 行为。Vue SPA 不一定需要额外手写过宽的 `_redirects`。

## Pages 发布是否都会有这个问题

不是每次 Pages 发布都会有这个问题。

正常情况下，如果用户刷新后拿到最新 `index.html`，并且这个 `index.html` 引用的 JS/CSS 确实存在于同一个当前 production deployment 里，那么资源应该可以正常返回。

但是 Pages 的发布模型确实容易暴露这类风险，因为 Pages 的生产域名通常只指向一个当前 deployment：

```txt
发布前：
www.example.com -> Deployment A

发布后：
www.example.com -> Deployment B
```

它不是 Cloudflare Workers Gradual Deployments 那种：

```txt
用户 1 -> Worker A
用户 2 -> Worker B
同一个用户通过 version affinity 稳定命中同一个版本
```

因此，只要出现新旧资源交叉、资源路径错误、旧 HTML 没有完全失效、旧 chunk 不再存在，就可能表现为：

```txt
JS 资源请求返回 index.html
Content-Type 变成 text/html
浏览器报 MIME type 不匹配
页面白屏
```

## 最常见触发场景

### 1. 用户拿着旧 HTML 请求旧 chunk

```txt
用户打开 A 版本页面
生产发布切到 B
用户在旧页面上点击菜单
Vue 动态加载 A 版本的 chunk
当前 Pages production deployment 已经没有 A 的 chunk
Pages fallback 返回 index.html
浏览器报 MIME type 错误
```

### 2. 新 index.html 引用了不存在的资源

```txt
新 index.html 引用 /assets/a.js
但当前 Pages deployment 实际没有 /assets/a.js
```

可能原因是构建产物不完整、output directory 配错、base 路径错误、部署了错误分支或错误 commit。

### 3. SPA fallback 或 _redirects 规则过宽

```txt
/assets/a.js
  -> 没找到真实文件
  -> 被 /* /index.html 200 改写
  -> 返回 index.html
```

### 4. HTML 缓存策略不符合预期

即使业务认为 `index.html` 没有缓存，也要确认实际响应头和 Cloudflare Cache Rules。

重点检查：

```txt
cache-control
cf-cache-status
age
etag
last-modified
```

## 排查步骤

### 1. 确认请求的资源路径

从浏览器 Network 面板复制失败资源的完整 URL，例如：

```txt
https://www.example.com/assets/a.js
```

检查它是否和当前生产 deployment 的实际构建产物一致。

### 2. 直接请求失败资源

查看响应状态、响应头和响应体前几行。

重点看：

```txt
status
content-type
cache-control
cf-cache-status
age
```

如果响应体是 `<!doctype html>` 或 `<html>`，说明资源请求被返回成了 HTML。

### 3. 检查 Pages 构建产物

确认 Cloudflare Pages 的配置：

```txt
Build command
Build output directory
Root directory
Production branch
```

确认失败的 JS 文件是否真的在最终上传目录中。

### 4. 检查 Vite base 配置

如果应用部署在子路径下，需要确认：

```ts
export default defineConfig({
  base: '/正确的子路径/',
})
```

如果部署在域名根路径，一般是：

```ts
export default defineConfig({
  base: '/',
})
```

### 5. 检查 _redirects

如果有：

```txt
/* /index.html 200
```

需要确认它不会吞掉静态资源 404。

更稳的策略是区分资源请求和页面路由。资源请求缺失时应该暴露 404，而不是返回 `index.html`。

### 6. 检查是否保留旧 assets

如果用户可能长时间停留在旧页面上，新部署不能立即让旧 hash chunk 消失。

理想结构：

```txt
dist/
  releases/
    20260806-a/
      assets/
    20260807-b/
      assets/
  index.html
```

旧页面引用：

```txt
/releases/20260806-a/assets/xxx.js
```

新页面引用：

```txt
/releases/20260807-b/assets/yyy.js
```

这样即使生产入口切到新版本，旧页面请求旧资源也还能拿到文件。

## 推荐防护策略

### 1. HTML 不长缓存

`index.html` 建议：

```txt
Cache-Control: no-cache, must-revalidate
```

或者更保守：

```txt
Cache-Control: no-store
```

### 2. Hash 静态资源长缓存

JS/CSS 资源文件名要带 hash：

```txt
assets/index.abc123.js
assets/user-page.def456.js
```

响应头建议：

```txt
Cache-Control: public, max-age=31536000, immutable
```

### 3. 保留上一版资源一段时间

Pages 生产域名切到新 deployment 后，旧页面仍可能继续请求旧 chunk。

为了避免白屏，发布包中可以保留至少上一版资源：

```txt
当前版本 assets
上一版本 assets
```

保留周期可以根据用户平均在线时长决定，例如：

```txt
保留 1 天
保留 3 天
保留 7 天
```

### 4. 前端捕获 chunk load error

Vue Router 可以监听动态 import 失败：

```ts
router.onError((error) => {
  const message = String(error?.message || error)

  if (
    /Loading chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  ) {
    window.location.reload()
  }
})
```

管理后台也可以改成提示：

```txt
系统已更新，请刷新页面继续使用
```

### 5. 增加版本检测

前端定时请求：

```txt
/version.json
```

示例：

```json
{
  "buildId": "2026-08-07-b"
}
```

如果发现线上 `buildId` 和当前页面内置 `buildId` 不一致，提示用户刷新。

### 6. 避免把资源请求 fallback 到 index.html

资源路径缺失时，更合理的行为是返回 404，而不是返回 `index.html`。

建议至少让这些路径缺失时保持 404：

```txt
/assets/*
/*.js
/*.css
/*.map
/*.json
/*.wasm
/*.png
/*.svg
/*.ico
```

这样问题会表现为清晰的 404，而不是 MIME type 错误导致白屏。

## Pages 是否适合企业级管理后台

可以用，但要接受它的发布模型。

Cloudflare Pages 适合：

```txt
Vue SPA 管理后台
文档站
营销站
功能通过 feature flag 灰度
可以接受发布后提示用户刷新
可以接受快速 rollback
```

但如果要求：

```txt
同一个生产域名
新旧 deployment 同时接流量
按用户灰度
同一个用户稳定命中同一个版本
HTML、JS/CSS、API 都做版本亲和
```

那么单独使用 Cloudflare Pages 不够匹配，更适合使用：

```txt
Cloudflare Workers Static Assets
Workers Gradual Deployments
Cloudflare-Workers-Version-Key
Version Affinity
```

## 结论

这类问题不是 Pages 每次发布都会必然发生，但 Pages 的 SPA fallback 会把“缺失资源”伪装成 `index.html`。

因此一旦出现新旧版本资源交叉、资源路径错误或旧 chunk 被移除，就可能看到：

```txt
请求 JS
返回 HTML
MIME type 不匹配
页面白屏
```

最小可落地防护是：

```txt
1. index.html 不长缓存
2. assets 使用 hash 文件名和长缓存
3. 发布包保留上一版 assets
4. 避免资源请求 fallback 到 index.html
5. 前端捕获 chunk load error 并提示刷新
6. 增加 version.json 检测线上版本变化
```

