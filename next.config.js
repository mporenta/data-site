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

  // Proxy API requests to Python FastAPI
  // Note: Python API serves at /bi/*, so we strip the /api prefix
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://127.0.0.1:8000';

    return [
      {
        source: '/api/bi/:path*',
        destination: `${apiUrl}/bi/:path*`
      },
      {
        source: '/api/health',
        destination: `${apiUrl}/health`
      }
    ];
  },
}

module.exports = nextConfig
