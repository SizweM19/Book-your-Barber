/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@byb/ui',
    '@byb/types',
    '@byb/database',
    '@byb/auth',
    '@byb/validation',
    '@byb/config',
  ],
}

export default nextConfig
