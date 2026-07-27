type SeoInput = {
  title: string
  description: string
  image?: string
}

export function usePageSeo(input: SeoInput) {
  const config = useRuntimeConfig()
  const fullTitle = `${input.title} | ${config.public.appName}`
  const image = input.image || `${config.public.siteUrl}/og-default.svg`

  useSeoMeta({
    title: fullTitle,
    ogTitle: fullTitle,
    description: input.description,
    ogDescription: input.description,
    ogImage: image,
    twitterCard: 'summary_large_image'
  })
}
