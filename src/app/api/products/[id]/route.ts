import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { deleteCmsProduct, hasSupabaseWriteConfig } from "@/lib/supabase-rest";

type Props = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: Props) {
  const adminError = validateAdminRequest(request);
  if (adminError) {
    return adminError;
  }

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json({ error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  try {
    const { id } = await params;
    await deleteCmsProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xóa được sản phẩm.";
    return NextResponse.json({ error: message }, { status: message.includes("Không tìm thấy") ? 404 : 500 });
  }
}
