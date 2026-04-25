import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  try {
    const stats = await getAdminStats();
    return NextResponse.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tải được thống kê.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
