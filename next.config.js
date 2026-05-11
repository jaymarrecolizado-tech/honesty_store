/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/checkout',
        destination: 'http://pocketbase:8090/checkout',
      },
      {
        source: '/api/:path*',
        destination: 'http://pocketbase:8090/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig