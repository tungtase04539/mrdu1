"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import type {
  AdminStats,
  CategoryRecord,
  LeadRecord,
  SubcategoryRecord
} from "@/lib/supabase-rest";
import { DashboardPanel } from "@/app/admin/panels/dashboard-panel";
import { ProductsPanel } from "@/app/admin/panels/products-panel";
import { LeadsPanel } from "@/app/admin/panels/leads-panel";
import { CategoriesPanel } from "@/app/admin/panels/categories-panel";
import { SubcategoriesPanel } from "@/app/admin/panels/subcategories-panel";

type InitialData = {
  products: Product[];
  categories: CategoryRecord[];
  subcategories: SubcategoryRecord[];
  leads: LeadRecord[];
  stats: AdminStats | null;
  authed: boolean;
  configured: boolean;
};

type Props = { initial: InitialData };

type TabId = "dashboard" | "products" | "leads" | "categories" | "subcategories";

const TABS: { id: TabId; label: string; caption: string }[] = [
  { id: "dashboard", label: "Dashboard", caption: "Tổng quan" },
  { id: "products", label: "Sản phẩm", caption: "Catalogue" },
  { id: "leads", label: "Leads", caption: "Khách tư vấn" },
  { id: "categories", label: "Danh mục", caption: "Category" },
  { id: "subcategories", label: "Danh mục con", caption: "Subcategory" }
];

export function AdminShell({ initial }: Props) {
  const [authed, setAuthed] = useState(initial.authed);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState<string>();
  const [loggingIn, setLoggingIn] = useState(false);

  const [products, setProducts] = useState(initial.products);
  const [categories, setCategories] = useState(initial.categories);
  const [subcategories, setSubcategories] = useState(initial.subcategories);
  const [leads, setLeads] = useState(initial.leads);
  const [stats, setStats] = useState(initial.stats);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!password) return;
    setLoggingIn(true);
    setLoginStatus("Đang đăng nhập...");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (response.ok && payload.ok) {
        setAuthed(true);
        setLoginStatus("Đăng nhập thành công. Đang tải dữ liệu...");
        setPassword("");
        await refreshAll();
        setLoginStatus(undefined);
      } else {
        setLoginStatus(payload.error ?? "Sai mật khẩu CMS.");
      }
    } catch {
      setLoginStatus("Không kết nối được server.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      setAuthed(false);
      setLoginStatus("Đã đăng xuất.");
    }
  }

  const refreshProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const payload = (await response.json()) as { products?: Product[] };
      if (response.ok && Array.isArray(payload.products)) setProducts(payload.products);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads?limit=200", { cache: "no-store" });
      const payload = (await response.json()) as { leads?: LeadRecord[] };
      if (response.ok && Array.isArray(payload.leads)) setLeads(payload.leads);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const payload = (await response.json()) as { categories?: CategoryRecord[] };
      if (response.ok && Array.isArray(payload.categories)) setCategories(payload.categories);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshSubcategories = useCallback(async () => {
    try {
      const response = await fetch("/api/subcategories", { cache: "no-store" });
      const payload = (await response.json()) as { subcategories?: SubcategoryRecord[] };
      if (response.ok && Array.isArray(payload.subcategories)) setSubcategories(payload.subcategories);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      const payload = (await response.json()) as { stats?: AdminStats };
      if (response.ok && payload.stats) setStats(payload.stats);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProducts(),
      refreshLeads(),
      refreshCategories(),
      refreshSubcategories(),
      refreshStats()
    ]);
  }, [refreshProducts, refreshLeads, refreshCategories, refreshSubcategories, refreshStats]);

  useEffect(() => {
    if (authed) {
      refreshAll();
    }
  }, [authed, refreshAll]);

  const counters = useMemo(
    () => ({
      products: products.length,
      leadsNew: leads.filter((lead) => lead.status === "new").length,
      categories: categories.length,
      subcategories: subcategories.length
    }),
    [products.length, leads, categories.length, subcategories.length]
  );

  if (!authed) {
    return (
      <main className="admin-shell admin-shell--locked">
        <div className="admin-login">
          <p className="eyebrow">CMS Mr Du</p>
          <h1>Khóa quản trị</h1>
          <p className="lead">Nhập mật khẩu CMS (biến môi trường `ADMIN_PASSWORD`) để mở khóa trang quản trị toàn diện.</p>
          <form onSubmit={login} className="admin-login-form">
            <label>
              Mật khẩu CMS
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="ADMIN_PASSWORD"
              />
            </label>
            <button className="button" type="submit" disabled={loggingIn || !password}>
              {loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            {loginStatus ? (
              <p className="muted" role="status" aria-live="polite">
                {loginStatus}
              </p>
            ) : null}
          </form>
          <p className="footer-note">
            Phiên kéo dài 2 giờ. Đăng xuất bất cứ lúc nào từ thanh trên cùng.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">CMS Mr Du · Maison</p>
          <h1>Trung tâm quản trị</h1>
          <p className="muted">
            {initial.configured
              ? "Đã kết nối Supabase · Cloudinary sẵn sàng · phiên 2 giờ."
              : "Chưa có Supabase env — CMS ở chế độ chỉ đọc, không lưu được."}
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="ghost-button" type="button" onClick={refreshAll}>
            Làm mới dữ liệu
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Điều hướng admin">
        {TABS.map((item) => {
          const counter =
            item.id === "products"
              ? counters.products
              : item.id === "leads"
              ? counters.leadsNew
              : item.id === "categories"
              ? counters.categories
              : item.id === "subcategories"
              ? counters.subcategories
              : null;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-tab${active ? " is-active" : ""}`}
              onClick={() => setTab(item.id)}
              aria-pressed={active}
            >
              <span className="admin-tab-label">{item.label}</span>
              <span className="admin-tab-caption">{item.caption}</span>
              {counter !== null ? <span className="admin-tab-count">{counter}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="admin-panel">
        {tab === "dashboard" ? (
          <DashboardPanel stats={stats} leads={leads} products={products} onRefresh={refreshAll} />
        ) : null}
        {tab === "products" ? (
          <ProductsPanel
            products={products}
            categories={categories}
            onRefresh={async () => {
              await refreshProducts();
              await refreshStats();
            }}
          />
        ) : null}
        {tab === "leads" ? (
          <LeadsPanel
            leads={leads}
            onRefresh={async () => {
              await refreshLeads();
              await refreshStats();
            }}
          />
        ) : null}
        {tab === "categories" ? (
          <CategoriesPanel
            categories={categories}
            onRefresh={async () => {
              await refreshCategories();
              await refreshStats();
            }}
          />
        ) : null}
        {tab === "subcategories" ? (
          <SubcategoriesPanel
            categories={categories}
            subcategories={subcategories}
            onRefresh={async () => {
              await refreshSubcategories();
              await refreshStats();
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
