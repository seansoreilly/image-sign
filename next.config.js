/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is stable in Next.js 13+, no experimental flag needed
  images: {
    domains: ["lh3.googleusercontent.com"], // Allow Google profile images
  },
};

module.exports = nextConfig;
