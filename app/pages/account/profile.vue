<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

usePageSeo({
  title: '账户',
  description: '受保护页面示例，演示 Nuxt 路由中间件、SSR Cookie 转发和 Pinia 会话状态。'
})

const session = useSessionStore()
</script>

<template>
  <section class="profile-page">
    <div class="page-heading compact">
      <p class="eyebrow">Account</p>
      <h1>账户中心</h1>
      <p>这个页面会先在服务端判断登录态，再把会话状态交给客户端继续使用。</p>
    </div>

    <div v-if="session.user" class="profile-grid">
      <section class="profile-summary">
        <span class="avatar">{{ session.user.name.slice(0, 1) }}</span>
        <div>
          <h2>{{ session.user.name }}</h2>
          <p>{{ session.user.email }}</p>
        </div>
      </section>

      <section class="profile-panel">
        <h2>会员信息</h2>
        <dl>
          <div>
            <dt>等级</dt>
            <dd>{{ session.user.tier }}</dd>
          </div>
          <div>
            <dt>积分</dt>
            <dd>{{ session.user.points.toLocaleString('zh-CN') }}</dd>
          </div>
          <div>
            <dt>偏好</dt>
            <dd>{{ session.user.preference }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>
