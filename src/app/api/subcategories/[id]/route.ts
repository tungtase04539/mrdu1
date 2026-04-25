import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { deleteSubcategory, hasSupabaseWriteConfig, upsertSubcategory } from "@/lib/supabase-rest";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json(
      { error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const { id } = await params;
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
      id,
      category_id: String(body.category_id ?? "").trim(),
      slug: String(body.slug ?? "").trim(),
      name: String(body.name ?? "").trim(),
      sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined
    });
    return NextResponse.json({ subcategory: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không cập nhật được danh mục con.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json(
      { error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const { id } = await params;
  try {
    await deleteSubcategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xoá được danh mục con.";
    return NextResponse.json({ error: message }, { status: message.includes("Không tìm thấy") ? 404 : 500 });
  }
}
