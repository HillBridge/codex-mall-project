export default defineAppConfig({
  product: {
    name: 'Nuxt Pilot',
    description: '用于沉淀 Nuxt 中大型项目经验的真实工程样板'
  },
  navigation: [
    { label: '首页', to: '/' },
    { label: '商品', to: '/products' },
    { label: '账户', to: '/account/profile' }
  ]
})
