/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  },
  // 모든 출처에서 이미지를 최적화할 수 있도록 설정
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
