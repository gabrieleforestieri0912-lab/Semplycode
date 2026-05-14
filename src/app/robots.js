export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/settings/', '/chat/'],
    },
    sitemap: 'https://semplycode.com/sitemap.xml',
  };
}
