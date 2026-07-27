<script setup lang="ts">
import { navigateTo, useRoute } from '#app/composables/router'
import { LogIn } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { z } from 'zod'
import { usePageSeo } from '~/composables/usePageSeo'
import { useSessionStore } from '~/stores/session'

usePageSeo({
  title: '登录',
  description: 'Nuxt Cookie 鉴权示例页面。'
})

const route = useRoute()
const session = useSessionStore()
const form = reactive({
  email: 'demo@example.com',
  password: 'nuxt-demo'
})
const message = ref('')

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少 6 位')
})

async function submit() {
  message.value = ''
  const parsed = schema.safeParse(form)
  if (!parsed.success) {
    message.value = parsed.error.issues[0]?.message || '表单填写有误'
    return
  }

  try {
    await session.login(parsed.data)
    await navigateTo(typeof route.query.redirect === 'string' ? route.query.redirect : '/account/profile')
  } catch {
    message.value = '登录失败，请检查账号或密码。'
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-copy">
      <p class="eyebrow">Auth Boundary==</p>
      <h1>服务端 Cookie 登录</h1>
      <p>默认演示账号已经填好，用它可以进入受保护的账户页。</p>
    </div>
    <form class="auth-form" @submit.prevent="submit">
      <label>
        <span>邮箱</span>
        <input v-model="form.email" autocomplete="email" type="email">
      </label>
      <label>
        <span>密码</span>
        <input v-model="form.password" autocomplete="current-password" type="password">
      </label>
      <p v-if="message" class="form-error">{{ message }}</p>
      <button class="button primary" type="submit" :disabled="session.pending">
        <LogIn :size="18" />
        {{ session.pending ? '登录中' : '登录' }}
      </button>
    </form>
  </section>
</template>
