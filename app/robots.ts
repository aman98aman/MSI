import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/super-admin/',
          '/reception/',
          '/marketing/',
          '/teacher/',
          '/student/dashboard/',
          '/student/login/',
          '/teacher/login/',
          '/reception/login/',
          '/marketing/login/',
          '/login/',
        ],
      },
    ],
    sitemap: 'https://www.msiinstitutes.com/sitemap.xml',
  };
}

