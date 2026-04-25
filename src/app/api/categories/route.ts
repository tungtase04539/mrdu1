import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import {
  hasSupabaseConfig,
  hasSupabaseWriteConfig,
  listCategoriesFromCms,
  upsertCategory
} from "@/lib/supabase-rest";
import { categories as staticCategories } from "@/lib/catalog";

export async function GET() {
  const rows = await listCategoriesFromCms();
  if (rows.length) {
    return NextResponse.json({ configured: hasSupabaseConfig(), categories: rows });
  }
  return NextResponse.json({
    configured: hasSupabaseConfig(),
    categories: staticCategories.map((category, index) => ({
      id: category.slug,
      slug: category.slug,
      name: category.title,
      short: category.accent,
      subtitle: category.eyebrow,
      description: category.description,
      hero_image: category.image,
      knowledge: category.education,
      sort_order: index * 10
    }))
  });
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
    const saved = await upsertCategory({
      id: typeof body.id === "string" ? body.id : undefined,
      slug: String(body.slug ?? "").trim(),
      name: String(body.name ?? "").trim(),
      short: typeof body.short === "string" ? body.short : undefined,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
      tagline: typeof body.tagline === "string" ? body.tagline : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      accent: typeof body.accent === "string" ? body.accent : undefined,
      hero_image: typeof body.hero_image === "string" ? body.hero_image : undefined,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined
    });
    return NextResponse.json({ category: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không lưu được danh mục.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
