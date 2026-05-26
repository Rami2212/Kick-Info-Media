import type { MetadataRoute } from "next";
import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { listTeams, teamCountryToSlug } from "@/lib/teams";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

function toAbsolute(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();

  const [posts, categories, products, teams] = await Promise.all([
    listBlogPosts({ publishedOnly: true }),
    listCategories(),
    listProducts({ publishedOnly: true }),
    listTeams({ publishedOnly: true }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: toAbsolute(baseUrl, "/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: toAbsolute(baseUrl, "/posts"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: toAbsolute(baseUrl, "/live"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: toAbsolute(baseUrl, "/fifa-world-cup"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: toAbsolute(baseUrl, "/fifa-game"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: toAbsolute(baseUrl, "/rankings"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: toAbsolute(baseUrl, "/teams"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: toAbsolute(baseUrl, "/products"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: toAbsolute(baseUrl, "/schedule"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: toAbsolute(baseUrl, "/football"), lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: toAbsolute(baseUrl, "/search"), lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: toAbsolute(baseUrl, "/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: toAbsolute(baseUrl, `/posts/${post.slug}`),
    lastModified: post.updated_at ? new Date(post.updated_at) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: toAbsolute(baseUrl, `/category/${category.slug}`),
    lastModified: category.updated_at ? new Date(category.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: toAbsolute(baseUrl, `/products/${product.slug}`),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const teamRoutes: MetadataRoute.Sitemap = teams.map((team) => ({
    url: toAbsolute(baseUrl, `/teams/${teamCountryToSlug(team.country) || team.id}`),
    lastModified: team.updated_at ? new Date(team.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes, ...productRoutes, ...teamRoutes];
}
