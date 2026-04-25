"use client";

import { useState } from "react";
import type { CategoryRecord } from "@/lib/supabase-rest";

type Props = {
  categories: CategoryRecord[];
  onRefresh: () => void | Promise<void>;
};

type Draft = {
  id?: string;
  slug: string;
  name: string;
  short: string;
  subtitle: string;
  tagline: string;
  description: string;
  accent: string;
  hero_image: string;
  sort_order: number;
};

const emptyDraft: Draft = {
  id: undefined,
  slug: "",
  name: "",
  short: "",
  subtitle: "",
  tagline: "",
  description: "",
  accent: "",
  hero_image: "",
  sort_order: 100
};

export function CategoriesPanel({ categories, onRefresh }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();

  function edit(record: CategoryRecord) {
    setDraft({
      id: record.id,
      slug: record.slug,
      name: record.name,
      short: record.short ?? "",
      subtitle: record.subtitle ?? "",
      tagline: record.tagline ?? "",
      description: record.description ?? "",
      accent: record.accent ?? "",
      hero_image: record.hero_image ?? "",
      sort_order: record.sort_order ?? 100
    });
    setStatus(`Đang sửa: ${record.name}`);
  }

  function reset() {
    setDraft(emptyDraft);
    setStatus("Bắt đầu danh mục mới.");
  }

  async function save() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setStatus(validationError);
      return;
    }
    setIsBusy(true);
    setStatus("Đang lưu danh mục...");
    try {
      const url = draft.id && isUuid(draft.id) ? `/api/categories/${draft.id}` : "/api/categories";
      const method = draft.id && isUuid(draft.id) ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug,
          name: draft.name,
          short: draft.short || null,
          subtitle: draft.subtitle || null,
          tagline: draft.tagline || null,
          description: draft.description || null,
          accent: draft.accent || null,
          hero_image: draft.hero_image || null,
          sort_order: Number(draft.sort_order) || 100
        })
      });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      reset();
      setStatus("Đã lưu danh mục.");
    } catch {
      setStatus("Không kết nối được server.");
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(record: CategoryRecord) {
    if (!confirm(`Xoá danh mục "${record.name}"? Sản phẩm gán danh mục này sẽ mất liên kết.`)) return;
    if (!isUuid(record.id)) {
      setStatus("Danh mục seed (chưa ở Supabase) thì không xoá được — thêm vào Supabase trước.");
      return;
    }
    setDeletingId(record.id);
    setStatus("Đang xoá danh mục...");
    try {
      const response = await fetch(`/api/categories/${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatus("Đã xoá danh mục.");
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
          <p className="eyebrow">Category</p>
          <h2>Danh mục sản phẩm</h2>
          <p className="lead">Quản lý các maison chính (Yến sào, An cung,...). Nếu chỉnh sửa từ Supabase, CMS sẽ đồng bộ lên trang.</p>
        </div>
      </header>

      <div className="admin-split">
        <aside className="admin-form">
          <h3>{draft.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}</h3>
          <label>
            Tên danh mục *
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Slug *
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="vi-du-yen-sao" />
          </label>
          <div className="admin-row-2">
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
            <label>
              Accent
              <input value={draft.accent} onChange={(event) => setDraft((current) => ({ ...current, accent: event.target.value }))} placeholder="Dưỡng nhan · Bồi bổ · Trường thọ" />
            </label>
          </div>
          <label>
            Short
            <input value={draft.short} onChange={(event) => setDraft((current) => ({ ...current, short: event.target.value }))} />
          </label>
          <label>
            Subtitle
            <input value={draft.subtitle} onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))} />
          </label>
          <label>
            Tagline
            <input value={draft.tagline} onChange={(event) => setDraft((current) => ({ ...current, tagline: event.target.value }))} />
          </label>
          <label>
            Mô tả
            <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label>
            URL ảnh hero
            <input value={draft.hero_image} onChange={(event) => setDraft((current) => ({ ...current, hero_image: event.target.value }))} />
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sort</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Accent</th>
                <th>Nguồn</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="muted">Chưa có danh mục nào trong Supabase.</p>
                  </td>
                </tr>
              ) : (
                categories.map((record) => (
                  <tr key={record.id}>
                    <td>{record.sort_order ?? 100}</td>
                    <td>
                      <strong>{record.name}</strong>
                      <div className="muted small">{record.subtitle ?? "—"}</div>
                    </td>
                    <td>{record.slug}</td>
                    <td>{record.accent ?? "—"}</td>
                    <td>
                      <span className={`status-chip status-chip--${isUuid(record.id) ? "published" : "warning"}`}>
                        {isUuid(record.id) ? "Supabase" : "Seed"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="ghost-button" type="button" onClick={() => edit(record)}>
                          Sửa
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          disabled={deletingId === record.id || !isUuid(record.id)}
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
  if (!draft.name.trim()) return "Tên danh mục là bắt buộc.";
  if (!draft.slug.trim()) return "Slug là bắt buộc.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) return "Slug chỉ chữ thường, số và gạch ngang.";
  return null;
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
