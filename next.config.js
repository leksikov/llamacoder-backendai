/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MODEL_NAME: process.env.MODEL_NAME,
    CSB_API_KEY: process.env.CSB_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
      };
    }
    return config;
  },
}
