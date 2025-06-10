/** @type {import('next').NextConfig} */
const { execSync } = require("child_process");

// Get git commit hash at build time
function getGitCommitHash() {
  // First try Vercel's environment variable (available during Vercel builds)
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    const shortHash = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
    console.log("Using Vercel commit hash:", shortHash);
    return shortHash;
  }

  // Fallback to git command for local development
  try {
    const hash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    console.log("Using local git commit hash:", hash);
    return hash;
  } catch (error) {
    console.warn("Could not get git commit hash:", error.message);
    return "unknown";
  }
}

const nextConfig = {
  // App directory is stable in Next.js 13+, no experimental flag needed
  env: {
    GIT_COMMIT_HASH: getGitCommitHash(),
  },
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
