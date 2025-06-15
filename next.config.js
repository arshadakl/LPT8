/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Explicitly ensure we're not using static export mode
  // This allows dynamic API routes to work properly
  output: undefined, // This ensures server-side rendering is used
};

module.exports = nextConfig;