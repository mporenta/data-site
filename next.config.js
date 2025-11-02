/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    unoptimized: false,
  },

  // Custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },

  // Proxy API requests to Python FastAPI in development
  // Note: Python API serves at /bi/*, so we strip the /api prefix
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/bi/:path*',
        destination: 'http://127.0.0.1:8000/bi/:path*'
      },
      {
        source: '/api/health',
        destination: 'http://127.0.0.1:8000/health'
      }
    ] : []
  },
}

module.exports = nextConfig
