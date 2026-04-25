import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import {
  deleteLead,
  LEAD_STATUSES,
  updateLead,
  type LeadStatus
} from "@/lib/supabase-rest";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  const { id } = await params;
  let body: Partial<{ status: string; note: string | null; handled_by: string | null }> = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (body.status && !(LEAD_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Trạng thái lead không hợp lệ." }, { status: 400 });
  }
  if (body.note !== undefined && body.note !== null && typeof body.note !== "string") {
    return NextResponse.json({ error: "Ghi chú không hợp lệ." }, { status: 400 });
  }
  if (body.note && body.note.length > 2000) {
    return NextResponse.json({ error: "Ghi chú quá dài (>2000 ký tự)." }, { status: 400 });
  }

  try {
    const updated = await updateLead(id, {
      status: body.status as LeadStatus | undefined,
      note: body.note ?? null,
      handled_by: body.handled_by ?? null
    });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không cập nhật được lead.";
    return NextResponse.json({ error: message }, { status: message.includes("Không tìm thấy") ? 404 : 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  const { id } = await params;
  try {
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xoá được lead.";
    return NextResponse.json({ error: message }, { status: message.includes("Không tìm thấy") ? 404 : 500 });
  }
}
