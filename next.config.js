const nextConfig = {
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
  // Proxy API calls in development (optional fallback - CORS is resolved on backend)
  async rewrites() {
    // Check for dev environment first
    const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
    
    // CRITICAL: Require dev environment - do NOT fall back to production
    if (!devUrl) {
      console.warn('⚠️ Next.js proxy: Dev environment not configured. Proxy will not be set up.');
      console.warn('   Set NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai to enable proxy.');
      // Return empty rewrites - direct API calls will be used instead
      return [];
    }
    
    // Use dev environment for proxy
    const backendUrl = devUrl.replace(/\/+$/, ''); // Remove trailing slash
    
    console.warn('✅ Next.js proxy configured for DEV environment:', backendUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
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