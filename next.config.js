const nextConfig = {
  // Standalone output for FTP deployment (self-contained Node.js app)
  // Comment out for Render/Railway/Vercel (they handle Next.js natively)
  // Uncomment if deploying via FTP to company server
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.geowise.ai",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'geowisecontainer.blob.core.windows.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gw5cn.geowise.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gw5cndev.geowise.ai',
        pathname: '/**',
      },
    ],
  },
  // Note: API proxy is handled by app/api/[...path]/route.ts
  // This provides better cookie forwarding than Next.js rewrites
  // Rewrites are disabled to avoid conflicts with the API route handler
  async rewrites() {
    // API routes take precedence, so rewrites are not needed
    // The API route handler at app/api/[...path]/route.ts handles all /api/* requests
    return [];
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  // Compiler optimizations
  compiler: {
    // Remove console.log in production but keep console.error and console.warn for debugging
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;