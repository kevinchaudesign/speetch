/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  // Ne bloque pas le déploiement sur des problèmes ESLint. À auditer manuellement
  // via `npm run lint` régulièrement.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ["framer-motion"],
    serverActions: {
      // Permet l'upload de plusieurs fichiers design (10 Mo/fichier).
      // Limite par défaut Next = 1 Mo, ce qui bloque dès le 1er PDF.
      bodySizeLimit: "100mb",
    },
    // Next 15.5+ : limite séparée appliquée AVANT le middleware. Default
    // = 10mb. Sans surcharge, les uploads > 10mb cassent avec "Unexpected
    // end of form" même si serverActions.bodySizeLimit est plus grand.
    middlewareClientMaxBodySize: "100mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
