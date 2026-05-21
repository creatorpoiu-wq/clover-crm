import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/portal/'],
    },
    sitemap: 'https://pipeline-crm-react.vercel.app/sitemap.xml',
  }
}
