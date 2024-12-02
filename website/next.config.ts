import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:8000/:path*'
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*'
      }
    ]
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.join(__dirname, 'src'),
        '@components': path.join(__dirname, 'src/components'),
        '@lib': path.join(__dirname, 'src/lib'),
        '@styles': path.join(__dirname, 'src/styles'),
        '@utils': path.join(__dirname, 'src/utils'),
        '@api': path.join(__dirname, 'src/api'),
        '@types': path.join(__dirname, 'src/types'),
        '@hooks': path.join(__dirname, 'src/hooks'),
      },
      resolveExtensions: [
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
        '.css'
      ],
      moduleIdStrategy: 'deterministic',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/9.x/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, isServer) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "rehype": false,
        "rehype-prism-plus": false,
      }
    }
    // 确保正确处理 @uiw/react-md-editor
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  transpilePackages: [
    '@uiw/react-md-editor',
    'rehype',
    'rehype-prism-plus',
    '@uiw/react-markdown-preview'
  ],
}

export default nextConfig
