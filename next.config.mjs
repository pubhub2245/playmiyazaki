/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/ja", permanent: false },
    ];
  },
};

export default nextConfig;
