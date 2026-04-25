import { AdminClient } from "@/app/admin/admin-client";
import { listCmsProducts } from "@/lib/supabase-rest";

export const metadata = {
  title: "CMS Mr Du",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const products = await listCmsProducts();
  return <AdminClient initialProducts={products} />;
}
