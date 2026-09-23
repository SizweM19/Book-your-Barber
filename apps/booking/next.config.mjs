/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@byb/ui', '@byb/validation', '@byb/types', '@byb/database', '@byb/config'],
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
