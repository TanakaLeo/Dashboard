/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ← ESTA LINHA É ESSENCIAL
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
