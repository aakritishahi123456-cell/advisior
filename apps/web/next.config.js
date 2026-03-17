/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
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
}

module.exports = nextConfig
