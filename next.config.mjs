/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://gadtrack2-0.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
