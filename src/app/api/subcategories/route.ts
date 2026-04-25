import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import {
  hasSupabaseConfig,
  hasSupabaseWriteConfig,
  listSubcategoriesFromCms,
  upsertSubcategory
} from "@/lib/supabase-rest";

export async function GET() {
  const rows = await listSubcategoriesFromCms();
  return NextResponse.json({ configured: hasSupabaseConfig(), subcategories: rows });
}

export async function POST(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json(
      { error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload không hợp lệ." }, { status: 400 });
  }

  try {
    const saved = await upsertSubcategory({
      id: typeof body.id === "string" ? body.id : undefined,
      category_id: String(body.category_id ?? "").trim(),
      slug: String(body.slug ?? "").trim(),
      name: String(body.name ?? "").trim(),
      sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined
    });
    return NextResponse.json({ subcategory: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không lưu được danh mục con.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
