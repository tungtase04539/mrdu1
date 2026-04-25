"use client";

import { useMemo, useState } from "react";
import type { CategoryRecord, SubcategoryRecord } from "@/lib/supabase-rest";

type Props = {
  categories: CategoryRecord[];
  subcategories: SubcategoryRecord[];
  onRefresh: () => void | Promise<void>;
};

type Draft = {
  id?: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order: number;
};

const emptyDraft: Draft = {
  id: undefined,
  category_id: "",
  slug: "",
  name: "",
  sort_order: 100
};

export function SubcategoriesPanel({ categories, subcategories, onRefresh }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    if (filterCategory === "all") return subcategories;
    return subcategories.filter((item) => item.category_id === filterCategory);
  }, [subcategories, filterCategory]);

  const supabaseCategories = categories.filter((category) => isUuid(category.id));

  function edit(record: SubcategoryRecord) {
    setDraft({
      id: record.id,
      category_id: record.category_id,
      slug: record.slug,
      name: record.name,
      sort_order: record.sort_order ?? 100
    });
    setStatus(`Đang sửa: ${record.name}`);
  }

  function reset() {
    setDraft(emptyDraft);
    setStatus("Bắt đầu danh mục con mới.");
  }

  async function save() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setStatus(validationError);
      return;
    }
    setIsBusy(true);
    setStatus("Đang lưu danh mục con...");
    try {
      const url = draft.id && isUuid(draft.id) ? `/api/subcategories/${draft.id}` : "/api/subcategories";
      const method = draft.id && isUuid(draft.id) ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: draft.category_id,
          slug: draft.slug,
          name: draft.name,
          sort_order: Number(draft.sort_order) || 100
        })
      });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      reset();
      setStatus("Đã lưu danh mục con.");
    } catch {
      setStatus("Không kết nối được server.");
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(record: SubcategoryRecord) {
    if (!confirm(`Xoá danh mục con "${record.name}"?`)) return;
    setDeletingId(record.id);
    setStatus("Đang xoá...");
    try {
      const response = await fetch(`/api/subcategories/${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatus("Đã xoá danh mục con.");
    } catch {
      setStatus("Không kết nối được server.");
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="admin-panel-body">
      <header className="admin-panel-header">
        <div>
          <p className="eyebrow">Subcategory</p>
          <h2>Phân nhóm sản phẩm</h2>
          <p className="lead">Danh mục con thuộc các maison chính — dùng để gắn “Yến chưng sẵn”, “Hồng sâm nước”,...</p>
        </div>
      </header>

      <div className="admin-split">
        <aside className="admin-form">
          <h3>{draft.id ? "Chỉnh sửa" : "Tạo mới"}</h3>
          {supabaseCategories.length === 0 ? (
            <p className="muted">
              Chưa có danh mục nào trong Supabase. Tạo danh mục trong tab “Danh mục” trước khi thêm danh mục con.
            </p>
          ) : null}
          <label>
            Danh mục cha *
            <select
              value={draft.category_id}
              onChange={(event) => setDraft((current) => ({ ...current, category_id: event.target.value }))}
            >
              <option value="">-- Chọn danh mục --</option>
              {supabaseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tên *
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Slug *
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="vd-yen-chung-san" />
          </label>
          <label>
            Sort order
            <input
              type="number"
              min="0"
              step="10"
              value={draft.sort_order}
              onChange={(event) => setDraft((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
            />
          </label>

          <div className="admin-form-actions">
            <button className="button" type="button" disabled={isBusy} onClick={save}>
              {isBusy ? "Đang lưu..." : draft.id ? "Cập nhật" : "Tạo mới"}
            </button>
            <button className="ghost-button" type="button" disabled={isBusy} onClick={reset}>
              {draft.id ? "Huỷ" : "Đặt lại"}
            </button>
          </div>
          {status ? (
            <p className="muted" role="status" aria-live="polite">
              {status}
            </p>
          ) : null}
        </aside>

        <section className="admin-list">
          <div className="admin-filter-bar">
            <label className="admin-filter-select">
              Lọc danh mục cha
              <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
                <option value="all">Tất cả</option>
                {supabaseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Sort</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Danh mục cha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="muted">Chưa có danh mục con.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id}>
                    <td>{record.sort_order ?? 100}</td>
                    <td>
                      <strong>{record.name}</strong>
                    </td>
                    <td>{record.slug}</td>
                    <td>{categoryMap.get(record.category_id)?.name ?? record.category_id}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="ghost-button" type="button" onClick={() => edit(record)}>
                          Sửa
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          disabled={deletingId === record.id}
                          onClick={() => remove(record)}
                        >
                          {deletingId === record.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string | { message?: string } };
    return typeof payload.error === "string" ? payload.error : payload.error?.message ?? `Lỗi ${response.status}.`;
  } catch {
    return `Lỗi ${response.status}.`;
  }
}

function validateDraft(draft: Draft) {
  if (!draft.category_id) return "Chọn danh mục cha.";
  if (!draft.name.trim()) return "Tên là bắt buộc.";
  if (!draft.slug.trim()) return "Slug là bắt buộc.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) return "Slug chỉ chữ thường, số và gạch ngang.";
  return null;
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
