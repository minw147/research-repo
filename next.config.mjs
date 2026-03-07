/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["next-mdx-remote"],
};

export default nextConfig;
