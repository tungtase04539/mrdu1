"use client";

import { useMemo, useState } from "react";
import { categories, type Product } from "@/lib/catalog";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
  featured: false,
  stock: 100
};

type Props = {
  initialProducts: Product[];
};

export function AdminClient({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>();
  const [query, setQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);

  const filteredProducts = useMemo(() => {
    const needle = query.toLowerCase();
    return products.filter((product) => `${product.title} ${product.brand} ${product.categorySlug}`.toLowerCase().includes(needle));
  }, [products, query]);

  async function refresh() {
    try {
      const response = await fetch("/api/products");
      const payload = (await response.json()) as { products: Product[]; configured: boolean; warning?: string };
      if (!response.ok || !Array.isArray(payload.products)) {
        setStatus("Không tải lại được danh sách sản phẩm.");
        return;
      }
      setProducts(payload.products);
      setStatus(payload.warning ?? (payload.configured ? "Đã kết nối Supabase." : "Đang dùng seed local. CMS chỉ ghi khi có Supabase env."));
    } catch {
      setStatus("Không tải lại được danh sách sản phẩm.");
    }
  }

  async function save() {
    const validationError = validateDraft(draft, password);
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
    const payload = {
      ...draft,
      id: draft.id,
      slug,
      price: draft.price === undefined || draft.price === null ? undefined : Number(draft.price),
      stock: draft.stock === undefined || draft.stock === null ? undefined : Number(draft.stock)
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }

      setDraft(emptyProduct);
      setIsDirty(false);
      await refresh();
      setStatus("Đã lưu sản phẩm.");
    } catch {
      setStatus("Không kết nối được server khi lưu sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(product: Product) {
    if (!password) {
      setStatus("Nhập mật khẩu CMS trước khi xóa.");
      return;
    }

    if (!confirm(`Xóa "${product.title}" (${product.brand} · ${product.categorySlug})?`)) return;
    setDeletingId(product.id);
    setStatus("Đang xóa...");

    try {
      const response = await fetch(`/api/products/${product.id || product.slug}`, {
        method: "DELETE",
        headers: { "x-admin-password": password }
      });

      if (!response.ok) {
        setStatus(await getErrorMessage(response));
        return;
      }

      await refresh();
      setStatus("Đã xóa sản phẩm.");
    } catch {
      setStatus("Không kết nối được server khi xóa sản phẩm.");
    } finally {
      setDeletingId(undefined);
    }
  }

  async function upload(file: File) {
    if (!password) {
      setStatus("Nhập mật khẩu CMS trước khi upload ảnh.");
      return;
    }

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
      const response = await fetch("/api/cloudinary", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData
      });
      const payload = (await response.json()) as { secure_url?: string; error?: string | { message?: string } };

      if (!response.ok || !payload.secure_url) {
        setStatus(getPayloadError(payload) ?? "Upload Cloudinary thất bại.");
        return;
      }

      setDraft((current) => ({ ...current, imageUrl: payload.secure_url }));
      setIsDirty(true);
      setStatus("Đã upload ảnh.");
    } catch {
      setStatus("Không kết nối được server khi upload ảnh.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="admin-shell">
      <div className="section-title">
        <div>
          <p className="eyebrow">CMS Mr Du</p>
          <h1>Quản trị sản phẩm</h1>
          <p className="lead">CRUD sản phẩm qua Supabase REST, upload ảnh qua Cloudinary signed API, dùng seed local khi chưa có env.</p>
        </div>
      </div>

      <div className="admin-grid">
        <aside className="form-card">
          <label>
            Mật khẩu CMS
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="ADMIN_PASSWORD" />
          </label>
          <div className="admin-form">
            <label>
              Tên sản phẩm
              <input value={draft.title} onChange={(event) => setDraftField("title", event.target.value)} />
            </label>
            <label>
              Slug
              <input value={draft.slug} onChange={(event) => setDraftField("slug", event.target.value)} placeholder="tu-dong-neu-bo-trong" />
            </label>
            <label>
              Dòng sản phẩm
              <select value={draft.categorySlug} onChange={(event) => setDraftCategory(event.target.value)}>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Thương hiệu
              <input value={draft.brand} onChange={(event) => setDraftField("brand", event.target.value)} />
            </label>
            <label>
              Danh mục con
              <input value={draft.subcategory ?? ""} onChange={(event) => setDraftField("subcategory", event.target.value)} />
            </label>
            <label>
              Xuất xứ
              <input value={draft.origin ?? ""} onChange={(event) => setDraftField("origin", event.target.value)} />
            </label>
            <label>
              Giá
              <input min="0" value={draft.price ?? ""} onChange={(event) => setDraftField("price", event.target.value === "" ? undefined : Number(event.target.value))} type="number" />
            </label>
            <label>
              Tồn kho
              <input min="0" step="1" value={draft.stock ?? ""} onChange={(event) => setDraftField("stock", event.target.value === "" ? undefined : Number(event.target.value))} type="number" />
            </label>
            <label>
              Mô tả ngắn
              <textarea value={draft.shortDescription} onChange={(event) => setDraftField("shortDescription", event.target.value)} />
            </label>
            <label>
              Mô tả chi tiết
              <textarea value={draft.description} onChange={(event) => setDraftField("description", event.target.value)} />
            </label>
            <label>
              Thành phần
              <textarea value={draft.ingredients ?? ""} onChange={(event) => setDraftField("ingredients", event.target.value)} />
            </label>
            <label>
              Cách dùng
              <textarea value={draft.usage ?? ""} onChange={(event) => setDraftField("usage", event.target.value)} />
            </label>
            <label>
              Cam kết
              <textarea value={draft.commitment ?? ""} onChange={(event) => setDraftField("commitment", event.target.value)} />
            </label>
            <label>
              URL ảnh
              <input value={draft.imageUrl ?? ""} onChange={(event) => setDraftField("imageUrl", event.target.value)} />
            </label>
            <label>
              Upload Cloudinary
              <input disabled={isUploading} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            </label>
            <label>
              <span>
                <input
                  checked={Boolean(draft.featured)}
                  onChange={(event) => setDraftField("featured", event.target.checked)}
                  type="checkbox"
                />{" "}
                Sản phẩm nổi bật
              </span>
            </label>
            <button className="button" disabled={isSaving || isUploading || Boolean(deletingId)} onClick={save} type="button">
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
            <button className="ghost-button" disabled={isSaving || isUploading || Boolean(deletingId)} onClick={newDraft} type="button">
              Tạo mới
            </button>
            {status ? <p className="muted" role="status" aria-live="polite">{status}</p> : null}
          </div>
        </aside>

        <section className="detail-panel">
          <label>
            Tìm sản phẩm
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, thương hiệu, danh mục..." />
          </label>
          <div className="table-list">
            {filteredProducts.map((product) => (
              <article className="table-item" key={product.id}>
                <div>
                  <strong>{product.title}</strong>
                  <p className="muted">
                    {product.brand} · {product.categorySlug} · {product.subcategory}
                  </p>
                </div>
                <div className="actions">
                  <button className="ghost-button" disabled={Boolean(deletingId) || isSaving || isUploading} onClick={() => editDraft(product)} type="button">
                    Sửa
                  </button>
                  <button className="ghost-button" disabled={Boolean(deletingId) || isSaving || isUploading} onClick={() => remove(product)} type="button">
                    {deletingId === product.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );

  function setDraftField<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  }

  function setDraftCategory(categorySlug: string) {
    setDraft((current) => ({ ...current, categorySlug, subcategory: "" }));
    setIsDirty(true);
  }

  function editDraft(product: Product) {
    if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Chuyển sản phẩm và bỏ thay đổi hiện tại?")) return;
    setDraft(product);
    setIsDirty(false);
    setStatus(`Đang sửa: ${product.title}`);
  }

  function newDraft() {
    if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Tạo mới và bỏ thay đổi hiện tại?")) return;
    setDraft(emptyProduct);
    setIsDirty(false);
    setStatus("Đang tạo sản phẩm mới.");
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

function validateDraft(draft: Product, password: string) {
  if (!password) return "Nhập mật khẩu CMS trước khi lưu.";
  if (!draft.title.trim()) return "Tên sản phẩm là bắt buộc.";
  if (!draft.brand.trim()) return "Thương hiệu là bắt buộc.";
  if (!draft.shortDescription.trim()) return "Mô tả ngắn là bắt buộc.";
  if (!draft.description.trim()) return "Mô tả chi tiết là bắt buộc.";
  if (draft.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  if (draft.price !== undefined && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0)) return "Giá phải là số không âm.";
  if (draft.stock !== undefined && (!Number.isInteger(Number(draft.stock)) || Number(draft.stock) < 0)) return "Tồn kho phải là số nguyên không âm.";
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
