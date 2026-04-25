import { AdminShell } from "@/app/admin/admin-shell";
import { hasServerAdminSession } from "@/lib/admin-auth";
import { categories as staticCategories } from "@/lib/catalog";
import {
  getAdminStats,
  hasSupabaseConfig,
  listCategoriesFromCms,
  listCmsProducts,
  listLeads,
  listSubcategoriesFromCms,
  type AdminStats,
  type CategoryRecord,
  type LeadRecord,
  type SubcategoryRecord
} from "@/lib/supabase-rest";

export const metadata = {
  title: "CMS Mr Du",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await hasServerAdminSession();
  const configured = hasSupabaseConfig();

  const emptyStats: AdminStats = {
    products: { total: 0, published: 0, featured: 0, lowStock: 0, perCategory: [] },
    leads: { total: 0, new: 0, contacted: 0, converted: 0, archived: 0, lastCreatedAt: null },
    categories: 0,
    subcategories: 0,
    configured
  };

  if (!authed) {
    return (
      <AdminShell
        initial={{
          products: [],
          categories: [],
          subcategories: [],
          leads: [],
          stats: emptyStats,
          authed: false,
          configured
        }}
      />
    );
  }

  const [products, categoryRows, subcategories, leads, stats] = await Promise.all([
    listCmsProducts({ includeUnpublished: true }),
    listCategoriesFromCms(),
    listSubcategoriesFromCms(),
    listLeads({ limit: 200 }),
    getAdminStats()
  ]);

  const categories: CategoryRecord[] = categoryRows.length
    ? categoryRows
    : staticCategories.map((category, index) => ({
        id: category.slug,
        slug: category.slug,
        name: category.title,
        short: category.accent,
        subtitle: category.eyebrow,
        description: category.description,
        hero_image: category.image,
        knowledge: category.education,
        sort_order: index * 10
      }));

  const initial: {
    products: typeof products;
    categories: CategoryRecord[];
    subcategories: SubcategoryRecord[];
    leads: LeadRecord[];
    stats: AdminStats;
    authed: boolean;
    configured: boolean;
  } = {
    products,
    categories,
    subcategories,
    leads,
    stats,
    authed: true,
    configured
  };

  return <AdminShell initial={initial} />;
}
