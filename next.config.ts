import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "recharts",
      "date-fns",
      "@hookform/resolvers",
    ],
  },
}

export default nextConfig

