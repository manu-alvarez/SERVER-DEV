/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['@uiep/entity-schema', '@uiep/design-engine', '@uiep/framework-adapter'],
};

module.exports = nextConfig;
