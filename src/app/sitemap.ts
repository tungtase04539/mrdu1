import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { listCmsProducts } from "@/lib/supabase-rest";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listCmsProducts();

  return [
    "",
    "/products",
    "/gioi-thieu",
    "/lien-he",
    ...categories.map((category) => `/products/${category.slug}`),
    ...products.map((product) => `/products/${product.categorySlug}/${product.slug}`)
  ].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path.startsWith("/products") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.7
  }));
}
