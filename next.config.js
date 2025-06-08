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
};

module.exports = nextConfig;
