import { NextResponse } from "next/server";
import type { Product } from "@/lib/catalog";
import { validateAdminRequest } from "@/lib/admin-auth";
import { hasSupabaseConfig, hasSupabaseWriteConfig, listCmsProducts, upsertCmsProduct } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const data = await listCmsProducts();
    return NextResponse.json({ configured: hasSupabaseConfig(), products: data });
  } catch {
    return NextResponse.json({ configured: hasSupabaseConfig(), error: "Không tải được sản phẩm." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) {
    return adminError;
  }

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json(
      { error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY. CMS đang khóa thao tác ghi." },
      { status: 503 }
    );
  }

  try {
    const product = await readProductRequest(request);
    if (!product.id) {
      const products = await listCmsProducts();
      if (products.some((item) => item.categorySlug === product.categorySlug && item.slug === product.slug)) {
        return NextResponse.json({ error: "Slug này đã tồn tại trong danh mục." }, { status: 409 });
      }
    }
    const validationError = validateProduct(product);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const saved = await upsertCmsProduct({
      ...product,
      featured: Boolean(product.featured),
      stock: product.stock === undefined ? undefined : Number(product.stock),
      price: product.price === undefined ? undefined : Number(product.price)
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: message === "JSON không hợp lệ." ? 400 : 500 });
  }
}

async function readProductRequest(request: Request) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("JSON không hợp lệ.");
    }
    return payload as Product;
  } catch (error) {
    if (error instanceof Error && error.message === "JSON không hợp lệ.") throw error;
    throw new Error("JSON không hợp lệ.");
  }
}

function validateProduct(product: Product) {
  if (!product.title?.trim()) return "Tên sản phẩm là bắt buộc.";
  if (!product.brand?.trim()) return "Thương hiệu là bắt buộc.";
  if (!product.categorySlug?.trim()) return "Dòng sản phẩm là bắt buộc.";
  if (!product.slug?.trim()) return "Slug là bắt buộc.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  if (!product.shortDescription?.trim()) return "Mô tả ngắn là bắt buộc.";
  if (!product.description?.trim()) return "Mô tả chi tiết là bắt buộc.";
  if (product.price !== undefined && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)) return "Giá phải là số không âm.";
  if (product.stock !== undefined && (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0)) return "Tồn kho phải là số nguyên không âm.";
  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không xử lý được yêu cầu.";
}
