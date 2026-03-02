const isGithubActions = process.env.GITHUB_ACTIONS || false;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isGithubActions ? "/research-repo" : "",
  images: { unoptimized: true },
  transpilePackages: ["next-mdx-remote"],
};

export default nextConfig;
