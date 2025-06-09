/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is stable in Next.js 13+, no experimental flag needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // SEO and Performance optimizations
  compress: true, // Enable gzip compression

  // Generate robots.txt and sitemap
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // SWC minification is enabled by default in Next.js 13+

  // Enable static optimization where possible
  trailingSlash: false,
};

module.exports = nextConfig;
