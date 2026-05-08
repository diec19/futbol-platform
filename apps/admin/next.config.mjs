/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@futbol/types', '@futbol/constants'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
