"use client";

import { useMemo, useState } from "react";
import { categories as staticCategories, formatPrice, type Product } from "@/lib/catalog";
import type { CategoryRecord } from "@/lib/supabase-rest";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PAGE_SIZE = 20;

const emptyProduct: Product = {
  id: "",
  slug: "",
  categorySlug: "yen-sao",
  title: "",
  brand: "",
  subcategory: "",
  origin: "Hàn Quốc",
  price: undefined,
  shortDescription: "",
  description: "",
  ingredients: "",
  usage: "",
  commitment: "",
  imageUrl: "",
  gallery: [],
  featured: false,
  published: true,
  sortOrder: undefined,
  stock: 100
};

type Props = {
  products: Product[];
  categories: CategoryRecord[];
  onRefresh: () => void | Promise<void>;
};

export function ProductsPanel({ products, categories, onRefresh }: Props) {
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [status, setStatus] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterState, setFilterState] = useState<"all" | "published" | "draft" | "featured" | "low-stock">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulking, setIsBulking] = useState(false);

  const categorySlugs = useMemo(() => {
    if (categories.length) return categories.map((row) => ({ slug: row.slug, name: row.name }));
    return staticCategories.map((category) => ({ slug: category.slug, name: category.title }));
  }, [categories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filterCategory !== "all" && product.categorySlug !== filterCategory) return false;
      if (filterState === "published" && product.published === false) return false;
      if (filterState === "draft" && product.published !== false) return false;
      if (filterState === "featured" && !product.featured) return false;
      if (filterState === "low-stock" && !(typeof product.stock === "number" && product.stock <= 10)) return false;
      if (!needle) return true;
      return `${product.title} ${product.brand} ${product.categorySlug} ${product.subcategory ?? ""} ${product.slug}`
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, filterCategory, filterState]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allPageSelected = paged.length > 0 && paged.every((product) => selectedIds.has(product.id));

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        paged.forEach((product) => next.delete(product.id));
      } else {
        paged.forEach((product) => next.add(product.id));
      }
      return next;
    });
  }

  async function save() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setStatus("Đang lưu...");
    setIsSaving(true);
    const slug = draft.slug || slugify(draft.title);
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setStatus("Slug tự động không hợp lệ. Vui lòng nhập slug thủ công.");
      setIsSaving(false);
      return;
    }

    const payload: Product = {
      ...draft,
      slug,
      price: draft.price === undefined || draft.price === null ? undefined : Number(draft.price),
      stock: draft.stock === undefined || draft.stock === null ? undefined : Number(draft.stock),
      sortOrder:
        draft.sortOrder === undefined || draft.sortOrder === null
          ? undefined
          : Number(draft.sortOrder),
      gallery: (draft.gallery ?? []).map((url) => url.trim()).filter(Boolean).slice(0, 6)
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }

      setDraft(emptyProduct);
      setIsDirty(false);
      await onRefresh();
      setStatus("Đã lưu sản phẩm.");
    } catch {
      setStatus("Không kết nối được server khi lưu sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(product: Product) {
    if (!confirm(`Xóa "${product.title}" (${product.brand} · ${product.categorySlug})?`)) return;
    setDeletingId(product.id);
    setStatus("Đang xóa...");

    try {
      const response = await fetch(`/api/products/${product.id || product.slug}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatus("Đã xóa sản phẩm.");
    } catch {
      setStatus("Không kết nối được server khi xóa sản phẩm.");
    } finally {
      setDeletingId(undefined);
    }
  }

  async function toggleField(product: Product, field: "featured" | "published") {
    const payload: Product = {
      ...product,
      featured: field === "featured" ? !product.featured : product.featured,
      published: field === "published" ? !(product.published ?? true) : product.published ?? true
    };
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatus(`Đã cập nhật ${field === "featured" ? "trạng thái nổi bật" : "xuất bản"}.`);
    } catch {
      setStatus("Không kết nối được server.");
    }
  }

  async function bulkToggle(field: "featured" | "published", value: boolean) {
    if (selectedIds.size === 0) return;
    if (!confirm(`${value ? "Bật" : "Tắt"} ${field === "featured" ? "nổi bật" : "xuất bản"} cho ${selectedIds.size} sản phẩm?`)) return;
    setIsBulking(true);
    setStatus("Đang cập nhật hàng loạt...");
    try {
      for (const id of Array.from(selectedIds)) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;
        const payload: Product = {
          ...product,
          featured: field === "featured" ? value : product.featured,
          published: field === "published" ? value : product.published ?? true
        };
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      setSelectedIds(new Set());
      await onRefresh();
      setStatus("Đã cập nhật hàng loạt.");
    } catch {
      setStatus("Lỗi khi cập nhật hàng loạt.");
    } finally {
      setIsBulking(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xoá vĩnh viễn ${selectedIds.size} sản phẩm? Thao tác không thể hoàn tác.`)) return;
    setIsBulking(true);
    setStatus("Đang xoá hàng loạt...");
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/products/${id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      await onRefresh();
      setStatus("Đã xoá hàng loạt.");
    } catch {
      setStatus("Lỗi khi xoá hàng loạt.");
    } finally {
      setIsBulking(false);
    }
  }

  async function upload(file: File, target: "image" | "gallery") {
    if (!allowedImageTypes.has(file.type)) {
      setStatus("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("Ảnh phải nhỏ hơn 5MB.");
      return;
    }

    setStatus("Đang upload ảnh Cloudinary...");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/cloudinary", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        secure_url?: string;
        error?: string | { message?: string };
      };
      if (!response.ok || !payload.secure_url) {
        setStatus(getPayloadError(payload) ?? "Upload Cloudinary thất bại.");
        return;
      }
      if (target === "image") {
        setDraft((current) => ({ ...current, imageUrl: payload.secure_url }));
      } else {
        setDraft((current) => ({
          ...current,
          gallery: [...(current.gallery ?? []), payload.secure_url!].slice(0, 6)
        }));
      }
      setIsDirty(true);
      setStatus("Đã upload ảnh.");
    } catch {
      setStatus("Không kết nối được server khi upload ảnh.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeGalleryAt(index: number) {
    setDraft((current) => ({
      ...current,
      gallery: (current.gallery ?? []).filter((_, idx) => idx !== index)
    }));
    setIsDirty(true);
  }

  return (
    <div className="admin-panel-body">
      <header className="admin-panel-header">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Sản phẩm & tồn kho</h2>
          <p className="lead">CRUD sản phẩm, toggle xuất bản/nổi bật, quản lý sort order, bulk action và gallery ảnh Cloudinary.</p>
        </div>
      </header>

      <div className="admin-split">
        <aside className="admin-form">
          <h3>{draft.id ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}</h3>
          <label>
            Tên sản phẩm *
            <input value={draft.title} onChange={(event) => setField("title", event.target.value)} />
          </label>
          <label>
            Slug
            <input value={draft.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="tu-dong-neu-bo-trong" />
          </label>
          <div className="admin-row-2">
            <label>
              Dòng sản phẩm *
              <select value={draft.categorySlug} onChange={(event) => setField("categorySlug", event.target.value)}>
                {categorySlugs.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Thương hiệu *
              <input value={draft.brand} onChange={(event) => setField("brand", event.target.value)} />
            </label>
          </div>
          <div className="admin-row-2">
            <label>
              Danh mục con
              <input value={draft.subcategory ?? ""} onChange={(event) => setField("subcategory", event.target.value)} />
            </label>
            <label>
              Xuất xứ
              <input value={draft.origin ?? ""} onChange={(event) => setField("origin", event.target.value)} />
            </label>
          </div>
          <div className="admin-row-3">
            <label>
              Giá (VND)
              <input
                min="0"
                type="number"
                value={draft.price ?? ""}
                onChange={(event) => setField("price", event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </label>
            <label>
              Tồn kho
              <input
                min="0"
                step="1"
                type="number"
                value={draft.stock ?? ""}
                onChange={(event) => setField("stock", event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </label>
            <label>
              Sort order
              <input
                min="0"
                step="1"
                type="number"
                value={draft.sortOrder ?? ""}
                onChange={(event) => setField("sortOrder", event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </label>
          </div>
          <label>
            Mô tả ngắn *
            <textarea value={draft.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} />
          </label>
          <label>
            Mô tả chi tiết *
            <textarea value={draft.description} onChange={(event) => setField("description", event.target.value)} />
          </label>
          <label>
            Thành phần
            <textarea value={draft.ingredients ?? ""} onChange={(event) => setField("ingredients", event.target.value)} />
          </label>
          <label>
            Cách dùng
            <textarea value={draft.usage ?? ""} onChange={(event) => setField("usage", event.target.value)} />
          </label>
          <label>
            Cam kết
            <textarea value={draft.commitment ?? ""} onChange={(event) => setField("commitment", event.target.value)} />
          </label>

          <label>
            URL ảnh chính
            <input value={draft.imageUrl ?? ""} onChange={(event) => setField("imageUrl", event.target.value)} />
          </label>
          <label>
            Upload ảnh chính (Cloudinary)
            <input
              disabled={isUploading}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => event.target.files?.[0] && upload(event.target.files[0], "image")}
            />
          </label>

          <fieldset className="admin-gallery">
            <legend>Gallery phụ (tối đa 6)</legend>
            <ol className="admin-gallery-list">
              {(draft.gallery ?? []).map((url, index) => (
                <li key={`${url}-${index}`}>
                  <span>{index + 1}.</span>
                  <input
                    value={url}
                    onChange={(event) => {
                      const next = [...(draft.gallery ?? [])];
                      next[index] = event.target.value;
                      setDraft((current) => ({ ...current, gallery: next }));
                      setIsDirty(true);
                    }}
                  />
                  <button className="ghost-button" type="button" onClick={() => removeGalleryAt(index)}>
                    Xoá
                  </button>
                </li>
              ))}
            </ol>
            {(draft.gallery?.length ?? 0) < 6 ? (
              <label>
                Thêm ảnh gallery
                <input
                  disabled={isUploading}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => event.target.files?.[0] && upload(event.target.files[0], "gallery")}
                />
              </label>
            ) : (
              <p className="muted">Đã đạt giới hạn 6 ảnh gallery.</p>
            )}
          </fieldset>

          <div className="admin-toggles">
            <label className="admin-toggle">
              <input
                checked={Boolean(draft.featured)}
                onChange={(event) => setField("featured", event.target.checked)}
                type="checkbox"
              />
              <span>Nổi bật</span>
            </label>
            <label className="admin-toggle">
              <input
                checked={draft.published !== false}
                onChange={(event) => setField("published", event.target.checked)}
                type="checkbox"
              />
              <span>Xuất bản</span>
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="button" disabled={isSaving || isUploading} onClick={save} type="button">
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
            <button className="ghost-button" disabled={isSaving || isUploading} onClick={newDraft} type="button">
              {draft.id ? "Huỷ & tạo mới" : "Đặt lại"}
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
            <label className="admin-filter-search">
              Tìm kiếm
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, thương hiệu, slug..." />
            </label>
            <label className="admin-filter-select">
              Danh mục
              <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
                <option value="all">Tất cả danh mục</option>
                {categorySlugs.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter-select">
              Trạng thái
              <select value={filterState} onChange={(event) => setFilterState(event.target.value as typeof filterState)}>
                <option value="all">Tất cả</option>
                <option value="published">Chỉ xuất bản</option>
                <option value="draft">Bản nháp</option>
                <option value="featured">Nổi bật</option>
                <option value="low-stock">Low-stock (≤10)</option>
              </select>
            </label>
          </div>

          <div className="admin-bulk-bar" role="toolbar" aria-label="Bulk actions">
            <label className="admin-bulk-check">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={togglePageSelection}
                aria-label="Chọn toàn bộ trang"
              />
              <span>
                {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : "Chọn toàn bộ trang"}
              </span>
            </label>
            <div className="admin-bulk-actions">
              <button
                className="ghost-button"
                disabled={isBulking || selectedIds.size === 0}
                onClick={() => bulkToggle("featured", true)}
                type="button"
              >
                Bật nổi bật
              </button>
              <button
                className="ghost-button"
                disabled={isBulking || selectedIds.size === 0}
                onClick={() => bulkToggle("featured", false)}
                type="button"
              >
                Tắt nổi bật
              </button>
              <button
                className="ghost-button"
                disabled={isBulking || selectedIds.size === 0}
                onClick={() => bulkToggle("published", true)}
                type="button"
              >
                Xuất bản
              </button>
              <button
                className="ghost-button"
                disabled={isBulking || selectedIds.size === 0}
                onClick={() => bulkToggle("published", false)}
                type="button"
              >
                Ẩn
              </button>
              <button
                className="ghost-button"
                disabled={isBulking || selectedIds.size === 0}
                onClick={bulkDelete}
                type="button"
              >
                Xoá
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn</th>
                <th>Sort</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <p className="muted">Không có sản phẩm khớp bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                paged.map((product) => (
                  <tr key={product.id} className={product.published === false ? "is-draft" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        aria-label={`Chọn ${product.title}`}
                      />
                    </td>
                    <td>
                      <strong>{product.title}</strong>
                      <div className="muted small">{product.brand} · {product.subcategory ?? "—"}</div>
                    </td>
                    <td>{product.categorySlug}</td>
                    <td>{typeof product.price === "number" && product.price > 0 ? formatPrice(product.price) : "—"}</td>
                    <td>
                      <span className={typeof product.stock === "number" && product.stock <= 10 ? "status-chip status-chip--warning" : undefined}>
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td>{product.sortOrder ?? (product.featured ? 0 : 100)}</td>
                    <td>
                      <div className="admin-state-stack">
                        <button
                          type="button"
                          className={`status-toggle${product.featured ? " is-on" : ""}`}
                          onClick={() => toggleField(product, "featured")}
                          aria-pressed={Boolean(product.featured)}
                        >
                          Nổi bật
                        </button>
                        <button
                          type="button"
                          className={`status-toggle${product.published !== false ? " is-on" : ""}`}
                          onClick={() => toggleField(product, "published")}
                          aria-pressed={product.published !== false}
                        >
                          {product.published === false ? "Draft" : "Published"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="ghost-button" type="button" onClick={() => edit(product)}>
                          Sửa
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => remove(product)}
                        >
                          {deletingId === product.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <footer className="admin-pagination">
            <span className="muted">
              {filtered.length} sản phẩm · trang {currentPage}/{totalPages}
            </span>
            <div className="admin-pagination-actions">
              <button className="ghost-button" type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                ← Trước
              </button>
              <button className="ghost-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                Sau →
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  }

  function edit(product: Product) {
    if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Chuyển sang sản phẩm khác?")) return;
    setDraft({ ...product, gallery: product.gallery ?? [] });
    setIsDirty(false);
    setStatus(`Đang sửa: ${product.title}`);
  }

  function newDraft() {
    if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Tạo mới và bỏ thay đổi hiện tại?")) return;
    setDraft(emptyProduct);
    setIsDirty(false);
    setStatus("Bắt đầu sản phẩm mới.");
  }
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string | { message?: string } };
    return getPayloadError(payload) ?? `Lỗi ${response.status}.`;
  } catch {
    return `Lỗi ${response.status}.`;
  }
}

function getPayloadError(payload: { error?: string | { message?: string } }) {
  return typeof payload.error === "string" ? payload.error : payload.error?.message;
}

function validateDraft(draft: Product) {
  if (!draft.title.trim()) return "Tên sản phẩm là bắt buộc.";
  if (!draft.brand.trim()) return "Thương hiệu là bắt buộc.";
  if (!draft.shortDescription.trim()) return "Mô tả ngắn là bắt buộc.";
  if (!draft.description.trim()) return "Mô tả chi tiết là bắt buộc.";
  if (draft.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  if (draft.price !== undefined && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0)) return "Giá phải là số không âm.";
  if (draft.stock !== undefined && (!Number.isInteger(Number(draft.stock)) || Number(draft.stock) < 0)) return "Tồn kho phải là số nguyên không âm.";
  if (draft.sortOrder !== undefined && draft.sortOrder !== null && (!Number.isFinite(Number(draft.sortOrder)) || Number(draft.sortOrder) < 0)) {
    return "Sort order phải là số không âm.";
  }
  return null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
