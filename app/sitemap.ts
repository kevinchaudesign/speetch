import type { MetadataRoute } from "next";
import { listPublishedPostSlugs } from "./blog/_lib/queries";

const BASE_URL = "https://speetch.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const blogPosts = await listPublishedPostSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/clients`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified:
        blogPosts.length > 0
          ? new Date(
              blogPosts.reduce(
                (max, p) => (p.updated_at > max ? p.updated_at : max),
                blogPosts[0].updated_at,
              ),
            )
          : now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogEntries,
  ];
}
