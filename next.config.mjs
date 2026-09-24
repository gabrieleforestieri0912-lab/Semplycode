/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/pricing",
        destination: "/#prezzi",
        permanent: true,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@fortawesome/react-fontawesome",
      "@fortawesome/free-brands-svg-icons",
      "lodash",
      "react-markdown",
      "remark-gfm",
    ],
  },
};

export default nextConfig;
