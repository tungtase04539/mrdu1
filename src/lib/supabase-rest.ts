import { categories, products, type Category, type Product } from "@/lib/catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_READ_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type LeadStatus = "new" | "contacted" | "converted" | "archived";
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "archived"];

export type Lead = {
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
};

export type LeadRecord = Lead & {
  id: string;
  status: LeadStatus;
  note?: string | null;
  handled_at?: string | null;
  handled_by?: string | null;
  created_at: string;
};

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  subtitle?: string | null;
  tagline?: string | null;
  description?: string | null;
  accent?: string | null;
  hero_image?: string | null;
  knowledge?: Category["education"] | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SubcategoryRecord = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminStats = {
  products: {
    total: number;
    published: number;
    featured: number;
    lowStock: number;
    perCategory: { slug: string; name: string; count: number }[];
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    converted: number;
    archived: number;
    lastCreatedAt: string | null;
  };
  categories: number;
  subcategories: number;
  configured: boolean;
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

export async function listCmsProducts(options?: { includeUnpublished?: boolean }): Promise<Product[]> {
  if (!hasSupabaseConfig()) return products;

  try {
    const query = options?.includeUnpublished
      ? "/rest/v1/products?select=*&order=sort_order.asc,name.asc"
      : "/rest/v1/products?select=*&is_published=eq.true&order=sort_order.asc,name.asc";
    const [response, lookup] = await Promise.all([
      supabaseFetch(query, {
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
    body: JSON.stringify({ ...lead, status: "new" })
  }, SUPABASE_SERVICE_KEY);

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

/* ===================== LEADS CRUD ===================== */

export async function listLeads(filter?: { status?: LeadStatus | "all"; q?: string; limit?: number }): Promise<LeadRecord[]> {
  if (!hasSupabaseWriteConfig()) return [];
  const params = new URLSearchParams({ select: "*", order: "created_at.desc" });
  if (filter?.status && filter.status !== "all") {
    params.set("status", `eq.${filter.status}`);
  }
  if (filter?.limit) params.set("limit", String(Math.min(Math.max(1, filter.limit), 500)));
  try {
    const response = await supabaseFetch(`/rest/v1/leads?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    }, SUPABASE_SERVICE_KEY);
    if (!response.ok) return [];
    const rows = (await response.json()) as LeadRecord[];
    const cleaned = rows.map(normalizeLead);
    if (!filter?.q) return cleaned;
    const needle = filter.q.trim().toLowerCase();
    if (!needle) return cleaned;
    return cleaned.filter((lead) =>
      `${lead.name} ${lead.phone} ${lead.email ?? ""} ${lead.interest ?? ""} ${lead.message ?? ""}`
        .toLowerCase()
        .includes(needle)
    );
  } catch {
    return [];
  }
}

export async function updateLead(id: string, patch: Partial<Pick<LeadRecord, "status" | "note" | "handled_by">>) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY để cập nhật lead.");
  }
  if (!isUuid(id)) {
    throw new Error("Lead id không hợp lệ.");
  }
  if (patch.status && !LEAD_STATUSES.includes(patch.status)) {
    throw new Error("Trạng thái lead không hợp lệ.");
  }
  const body: Record<string, unknown> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.note !== undefined) body.note = patch.note;
  if (patch.handled_by !== undefined) body.handled_by = patch.handled_by;
  if (patch.status && patch.status !== "new") body.handled_at = new Date().toISOString();
  if (patch.status === "new") body.handled_at = null;

  const response = await supabaseFetch(`/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body)
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const rows = (await response.json()) as LeadRecord[];
  if (!rows.length) throw new Error("Không tìm thấy lead.");
  return normalizeLead(rows[0]);
}

export async function deleteLead(id: string) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY để xoá lead.");
  }
  if (!isUuid(id)) {
    throw new Error("Lead id không hợp lệ.");
  }
  const response = await supabaseFetch(`/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" }
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const rows = (await response.json()) as LeadRecord[];
  if (!rows.length) throw new Error("Không tìm thấy lead.");
}

function normalizeLead(row: LeadRecord): LeadRecord {
  return {
    ...row,
    status: (LEAD_STATUSES.includes(row.status) ? row.status : "new") as LeadStatus,
    note: row.note ?? null,
    handled_at: row.handled_at ?? null,
    handled_by: row.handled_by ?? null
  };
}

/* ===================== CATEGORIES CRUD ===================== */

export async function listCategoriesFromCms(): Promise<CategoryRecord[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const response = await supabaseFetch("/rest/v1/categories?select=*&order=sort_order.asc,name.asc", {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) return [];
    return (await response.json()) as CategoryRecord[];
  } catch {
    return [];
  }
}

type CategoryInput = {
  id?: string;
  slug: string;
  name: string;
  short?: string;
  subtitle?: string;
  tagline?: string;
  description?: string;
  accent?: string;
  hero_image?: string;
  knowledge?: Category["education"];
  sort_order?: number;
};

export async function upsertCategory(input: CategoryInput) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!input.slug || !isValidSlug(input.slug)) throw new Error("Slug danh mục không hợp lệ.");
  if (!input.name?.trim()) throw new Error("Tên danh mục là bắt buộc.");

  const body: Record<string, unknown> = {
    slug: input.slug,
    name: input.name.trim(),
    short: input.short ?? null,
    subtitle: input.subtitle ?? null,
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    accent: input.accent ?? null,
    hero_image: input.hero_image ?? null,
    sort_order: input.sort_order ?? 100,
    updated_at: new Date().toISOString()
  };
  if (input.knowledge !== undefined) body.knowledge = input.knowledge;
  if (input.id && isUuid(input.id)) body.id = input.id;

  const response = await supabaseFetch("/rest/v1/categories", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(body)
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) throw new Error(await response.text());
  const [row] = (await response.json()) as CategoryRecord[];
  return row;
}

export async function deleteCategory(id: string) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!isUuid(id)) throw new Error("Category id không hợp lệ.");
  const response = await supabaseFetch(`/rest/v1/categories?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" }
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) throw new Error(await response.text());
  const rows = (await response.json()) as CategoryRecord[];
  if (!rows.length) throw new Error("Không tìm thấy danh mục.");
}

/* ===================== SUBCATEGORIES CRUD ===================== */

export async function listSubcategoriesFromCms(): Promise<SubcategoryRecord[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const response = await supabaseFetch(
      "/rest/v1/subcategories?select=*&order=category_id.asc,sort_order.asc,name.asc",
      { cache: "no-store", signal: AbortSignal.timeout(10_000) }
    );
    if (!response.ok) return [];
    return (await response.json()) as SubcategoryRecord[];
  } catch {
    return [];
  }
}

type SubcategoryInput = {
  id?: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order?: number;
};

export async function upsertSubcategory(input: SubcategoryInput) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!isUuid(input.category_id)) throw new Error("category_id không hợp lệ.");
  if (!input.slug || !isValidSlug(input.slug)) throw new Error("Slug danh mục con không hợp lệ.");
  if (!input.name?.trim()) throw new Error("Tên danh mục con là bắt buộc.");

  const body: Record<string, unknown> = {
    category_id: input.category_id,
    slug: input.slug,
    name: input.name.trim(),
    sort_order: input.sort_order ?? 100,
    updated_at: new Date().toISOString()
  };
  if (input.id && isUuid(input.id)) body.id = input.id;

  const response = await supabaseFetch("/rest/v1/subcategories", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(body)
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) throw new Error(await response.text());
  const [row] = (await response.json()) as SubcategoryRecord[];
  return row;
}

export async function deleteSubcategory(id: string) {
  if (!hasSupabaseWriteConfig()) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!isUuid(id)) throw new Error("Subcategory id không hợp lệ.");
  const response = await supabaseFetch(`/rest/v1/subcategories?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" }
  }, SUPABASE_SERVICE_KEY);
  if (!response.ok) throw new Error(await response.text());
  const rows = (await response.json()) as SubcategoryRecord[];
  if (!rows.length) throw new Error("Không tìm thấy danh mục con.");
}

/* ===================== ADMIN STATS ===================== */

export async function getAdminStats(): Promise<AdminStats> {
  const configured = hasSupabaseConfig();
  const [allProducts, leadRows, categoryRows, subcategoryRows] = await Promise.all([
    listCmsProducts(),
    hasSupabaseWriteConfig() ? listLeads({ limit: 500 }) : Promise.resolve([] as LeadRecord[]),
    listCategoriesFromCms(),
    listSubcategoriesFromCms()
  ]);

  const perCategoryMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const category of categories) {
    perCategoryMap.set(category.slug, { slug: category.slug, name: category.title, count: 0 });
  }
  for (const row of categoryRows) {
    if (!perCategoryMap.has(row.slug)) {
      perCategoryMap.set(row.slug, { slug: row.slug, name: row.name, count: 0 });
    }
  }
  for (const product of allProducts) {
    const bucket = perCategoryMap.get(product.categorySlug);
    if (bucket) bucket.count += 1;
  }

  const leadCounts = { new: 0, contacted: 0, converted: 0, archived: 0 };
  let lastLead: string | null = null;
  for (const lead of leadRows) {
    leadCounts[lead.status] = (leadCounts[lead.status] ?? 0) + 1;
    if (!lastLead || (lead.created_at && lead.created_at > lastLead)) lastLead = lead.created_at;
  }

  return {
    products: {
      total: allProducts.length,
      published: allProducts.length,
      featured: allProducts.filter((item) => item.featured).length,
      lowStock: allProducts.filter((item) => typeof item.stock === "number" && item.stock <= 10).length,
      perCategory: Array.from(perCategoryMap.values())
    },
    leads: {
      total: leadRows.length,
      new: leadCounts.new,
      contacted: leadCounts.contacted,
      converted: leadCounts.converted,
      archived: leadCounts.archived,
      lastCreatedAt: lastLead
    },
    categories: Math.max(categoryRows.length, categories.length),
    subcategories: subcategoryRows.length,
    configured
  };
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
    gallery: Array.isArray(row.gallery) ? row.gallery.filter(Boolean) : undefined,
    featured: row.featured ?? row.is_featured ?? false,
    published: row.is_published ?? true,
    sortOrder: row.sort_order,
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
    gallery: Array.isArray(product.gallery) ? product.gallery.filter(Boolean) : undefined,
    price: product.price,
    stock: product.stock,
    commitment: product.commitment,
    badge: product.badge,
    is_featured: product.featured,
    is_published: product.published ?? true,
    sort_order:
      typeof product.sortOrder === "number"
        ? product.sortOrder
        : product.featured
        ? 0
        : 100
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
