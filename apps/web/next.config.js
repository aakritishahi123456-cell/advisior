/** @type {import('next').NextConfig} */
const fallbackApiUrl = 'https://advisior-api.onrender.com'
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '')

const nextConfig = {
  experimental: {
    workerThreads: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  poweredByHeader: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    if (!normalizedApiUrl) {
      return []
    }

    return [
      {
        source: '/api/:path*',
        destination: `${normalizedApiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
