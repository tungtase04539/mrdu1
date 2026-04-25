"use client";

import type { Product } from "@/lib/catalog";
import type { AdminStats, LeadRecord } from "@/lib/supabase-rest";

type Props = {
  stats: AdminStats | null;
  leads: LeadRecord[];
  products: Product[];
  onRefresh: () => void | Promise<void>;
};

export function DashboardPanel({ stats, leads, products, onRefresh }: Props) {
  const newLeads = leads.filter((lead) => lead.status === "new");
  const lowStock = products
    .filter((item) => typeof item.stock === "number" && item.stock <= 10)
    .slice(0, 8);
  const recentLeads = leads.slice(0, 6);

  return (
    <div className="admin-panel-body">
      <header className="admin-panel-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Tổng quan vận hành maison</h2>
          <p className="lead">
            Cập nhật nhanh số liệu sản phẩm, leads và cảnh báo tồn kho thấp. Bấm “Làm mới” nếu cần kéo lại dữ liệu.
          </p>
        </div>
      </header>

      <section className="admin-stat-grid" aria-label="Chỉ số tổng quan">
        <StatBlock label="Sản phẩm đang bán" value={stats?.products.total ?? products.length} hint="Tất cả (kể cả draft nếu quyền admin)." />
        <StatBlock
          label="Nổi bật"
          value={stats?.products.featured ?? products.filter((p) => p.featured).length}
          hint="Đang xuất hiện tại khu Featured."
        />
        <StatBlock
          label="Low-stock (≤10)"
          value={stats?.products.lowStock ?? lowStock.length}
          hint="Cần bổ sung hàng."
          tone={lowStock.length ? "warning" : "default"}
        />
        <StatBlock
          label="Leads mới"
          value={stats?.leads.new ?? newLeads.length}
          hint={stats?.leads.lastCreatedAt ? `Gần nhất: ${formatDate(stats.leads.lastCreatedAt)}` : "Chưa có lead mới."}
          tone={newLeads.length ? "accent" : "default"}
        />
        <StatBlock label="Tổng leads" value={stats?.leads.total ?? leads.length} hint="Mọi trạng thái trong 500 gần nhất." />
        <StatBlock label="Danh mục" value={stats?.categories ?? 0} hint="Cấu hình maison chính." />
        <StatBlock label="Danh mục con" value={stats?.subcategories ?? 0} hint="Phân nhóm nội bộ." />
        <StatBlock label="Converted" value={stats?.leads.converted ?? 0} hint="Leads đã chốt thành khách hàng." />
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-card">
          <header className="admin-card-header">
            <p className="eyebrow">Leads mới nhất</p>
            <h3>Phản hồi gần đây</h3>
          </header>
          {recentLeads.length ? (
            <ul className="admin-lead-list">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <span className={`status-chip status-chip--${lead.status}`}>{lead.status}</span>
                  </div>
                  <p className="muted">
                    {lead.phone}
                    {lead.interest ? ` · ${lead.interest}` : ""}
                  </p>
                  <p className="muted small">{formatDate(lead.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Chưa có leads nào trong hệ thống.</p>
          )}
        </section>

        <section className="admin-card">
          <header className="admin-card-header">
            <p className="eyebrow">Low-stock</p>
            <h3>Sản phẩm cần bổ sung</h3>
          </header>
          {lowStock.length ? (
            <ul className="admin-lowstock-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.title}</strong>
                    <span className="muted small">{product.brand}</span>
                  </div>
                  <span className="status-chip status-chip--warning">
                    Còn {product.stock ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Mọi sản phẩm đều đủ tồn kho.</p>
          )}
        </section>

        <section className="admin-card">
          <header className="admin-card-header">
            <p className="eyebrow">Bộ sưu tập</p>
            <h3>Sản phẩm theo dòng</h3>
          </header>
          {stats?.products.perCategory?.length ? (
            <ul className="admin-category-distribution">
              {stats.products.perCategory.map((row) => (
                <li key={row.slug}>
                  <span>{row.name}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Chưa có thống kê danh mục.</p>
          )}
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Làm mới thống kê
          </button>
        </section>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <article className={`admin-stat admin-stat--${tone}`}>
      <span className="admin-stat-label">{label}</span>
      <strong>{value}</strong>
      {hint ? <span className="admin-stat-hint">{hint}</span> : null}
    </article>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}
