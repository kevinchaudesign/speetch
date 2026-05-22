import type { MetadataRoute } from "next";

const BASE_URL = "https://speetch.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/clients"],
        // L'admin est gated et privé — pas d'indexation.
        disallow: ["/admin", "/login", "/api", "/auth"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
