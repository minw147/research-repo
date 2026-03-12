/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Do not bundle ffmpeg-static so __dirname in that package resolves to node_modules
  // and the ffmpeg binary path is correct (avoids ENOENT when spawning).
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
