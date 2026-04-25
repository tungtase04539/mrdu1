import { categories, products, type Product } from "@/lib/catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_READ_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type Lead = {
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
};

type SubcategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

type ProductRow = {
  id?: string;
  slug: string;
  category_id?: string;
  subcategory_id?: string | null;
  name?: string;
  title?: string;
  brand?: string;
  short_description?: string;
  description?: string;
  ingredients?: string[] | string | null;
  usage?: string[] | string | null;
  origin?: string | null;
  image?: string | null;
  gallery?: string[] | null;
  badge?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  sort_order?: number;
  category_slug?: string;
  image_url?: string;
  featured?: boolean;
  stock?: number;
  price?: number;
  commitment?: string;
  updated_at?: string;
};

type CatalogLookup = {
  categoriesById: Map<string, CategoryRow>;
  categoriesBySlug: Map<string, CategoryRow>;
  subcategoriesById: Map<string, SubcategoryRow>;
  subcategoriesByCategoryAndName: Map<string, SubcategoryRow>;
};

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_READ_KEY);
}

export function hasSupabaseWriteConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function listCmsProducts(): Promise<Product[]> {
  if (!hasSupabaseConfig()) return products;

  try {
    const [response, lookup] = await Promise.all([
      supabaseFetch("/rest/v1/products?select=*&is_published=eq.true&order=sort_order.asc,name.asc", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000)
      }),
      getCatalogLookup()
    ]);

    if (!response.ok) return products;
    const rows = (await response.json()) as ProductRow[];
    return rows.length ? rows.map((row) => fromRow(row, lookup)).filter(isProduct) : products;
  } catch {
    return products;
  }
}

export async function upsertCmsProduct(product: Product) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY cho thao tác ghi CMS.");
  }

  const lookup = await getCatalogLookup();
  const category = lookup.categoriesBySlug.get(product.categorySlug);
  if (!category) {
    throw new Error(`Danh mục "${product.categorySlug}" chưa được cấu hình trong Supabase.`);
  }

  const existingId = isUuid(product.id) ? product.id : undefined;
  const response = await supabaseFetch("/rest/v1/products", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(toRow({ ...product, id: existingId ?? product.id }, lookup))
  }, SUPABASE_SERVICE_KEY);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const [row] = (await response.json()) as ProductRow[];
  return fromRow(row, lookup);
}

export async function deleteCmsProduct(id: string) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY cho thao tác xóa CMS.");
  }

  if (!isUuid(id)) {
    throw new Error("Chỉ được xóa sản phẩm bằng UUID để tránh xóa nhầm.");
  }

  const response = await supabaseFetch(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" }
  }, SUPABASE_SERVICE_KEY);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const deleted = (await response.json()) as ProductRow[];
  if (!deleted.length) {
    throw new Error("Không tìm thấy sản phẩm để xóa.");
  }
}

export async function createLead(lead: Lead) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY cho form liên hệ.");
  }

  const response = await supabaseFetch("/rest/v1/leads", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(lead)
  }, SUPABASE_SERVICE_KEY);

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

function supabaseFetch(path: string, init: RequestInit = {}, key = SUPABASE_READ_KEY) {
  const headers = new Headers(init.headers);
  headers.set("apikey", key ?? "");
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers
  });
}

async function getCatalogLookup(): Promise<CatalogLookup> {
  const [categoriesResponse, subcategoriesResponse] = await Promise.all([
    supabaseFetch("/rest/v1/categories?select=id,slug,name", { cache: "no-store" }),
    supabaseFetch("/rest/v1/subcategories?select=id,category_id,name", { cache: "no-store" })
  ]);

  const categoryRows = categoriesResponse.ok ? ((await categoriesResponse.json()) as CategoryRow[]) : [];
  const subcategoryRows = subcategoriesResponse.ok ? ((await subcategoriesResponse.json()) as SubcategoryRow[]) : [];

  return {
    categoriesById: new Map(categoryRows.map((row) => [row.id, row])),
    categoriesBySlug: new Map(categoryRows.map((row) => [row.slug, row])),
    subcategoriesById: new Map(subcategoryRows.map((row) => [row.id, row])),
    subcategoriesByCategoryAndName: new Map(subcategoryRows.map((row) => [subcategoryKey(row.category_id, row.name), row]))
  };
}

function fromRow(row: ProductRow, lookup: CatalogLookup): Product | null {
  const categorySlug = row.category_slug ?? (row.category_id ? lookup.categoriesById.get(row.category_id)?.slug : undefined);
  if (!categorySlug || !isValidSlug(categorySlug) || !isValidSlug(row.slug)) return null;
  const subcategoryName = row.subcategory_id ? lookup.subcategoriesById.get(row.subcategory_id)?.name : undefined;

  return {
    id: row.id ?? row.slug,
    slug: row.slug,
    categorySlug,
    title: row.title ?? row.name ?? "Sản phẩm",
    brand: row.brand ?? "Mr Du",
    badge: row.badge ?? undefined,
    origin: row.origin ?? undefined,
    subcategory: subcategoryName,
    price: row.price,
    shortDescription: row.short_description ?? row.description ?? "",
    description: row.description ?? row.short_description ?? "",
    ingredients: normalizeRichText(row.ingredients),
    usage: normalizeRichText(row.usage),
    commitment: row.commitment ?? "Cam kết chính hãng, tư vấn chuyên sâu, giao hàng toàn quốc và đổi trả theo chính sách.",
    imageUrl: row.image_url ?? row.image ?? row.gallery?.[0] ?? undefined,
    featured: row.featured ?? row.is_featured ?? false,
    stock: row.stock
  };
}

function toRow(product: Product, lookup: CatalogLookup): ProductRow {
  const category = lookup.categoriesBySlug.get(product.categorySlug);
  if (!category) {
    throw new Error(`Danh mục "${product.categorySlug}" chưa được cấu hình trong Supabase.`);
  }
  const subcategory = product.subcategory ? lookup.subcategoriesByCategoryAndName.get(subcategoryKey(category.id, product.subcategory)) : undefined;

  return {
    ...(isUuid(product.id) ? { id: product.id } : {}),
    slug: product.slug,
    category_id: category?.id,
    subcategory_id: subcategory?.category_id === category?.id ? subcategory?.id : undefined,
    name: product.title,
    brand: product.brand,
    origin: product.origin,
    short_description: product.shortDescription,
    description: product.description,
    ingredients: splitLines(product.ingredients),
    usage: splitLines(product.usage),
    image: product.imageUrl,
    price: product.price,
    stock: product.stock,
    commitment: product.commitment,
    badge: product.badge,
    is_featured: product.featured,
    is_published: true,
    sort_order: product.featured ? 0 : 100
  };
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function normalizeRichText(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value.join("\n");
  return value ?? undefined;
}

function splitLines(value: string | undefined) {
  if (!value) return undefined;
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function subcategoryKey(categoryId: string, name: string) {
  return `${categoryId}:${name.trim().toLocaleLowerCase("vi-VN")}`;
}

function isValidSlug(value: string | undefined) {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
}

function isProduct(value: Product | null): value is Product {
  return value !== null;
}
