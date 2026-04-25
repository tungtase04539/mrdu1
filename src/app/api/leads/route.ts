import { NextResponse } from "next/server";
import { isAuthorised, validateAdminRequest } from "@/lib/admin-auth";
import {
  createLead,
  hasSupabaseWriteConfig,
  LEAD_STATUSES,
  listLeads,
  type Lead,
  type LeadStatus
} from "@/lib/supabase-rest";

export async function GET(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 200);

  let status: LeadStatus | "all" | undefined = "all";
  if (statusParam && (LEAD_STATUSES as readonly string[]).includes(statusParam)) {
    status = statusParam as LeadStatus;
  }

  try {
    const leads = await listLeads({
      status,
      q,
      limit: Number.isFinite(limit) ? limit : 200
    });
    return NextResponse.json({ leads, configured: hasSupabaseWriteConfig() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tải được danh sách lead.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = isAuthorised(request);

  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json(
      { error: "Form liên hệ chưa được cấu hình lưu dữ liệu. Vui lòng gọi hotline hoặc Zalo." },
      { status: 503 }
    );
  }

  try {
    const lead = await readLeadRequest(request);
    const validationError = validateLead(lead);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await createLead({
      name: lead.name.trim(),
      phone: lead.phone.trim(),
      email: lead.email?.trim(),
      interest: lead.interest?.trim(),
      message: lead.message?.trim()
    });
    return NextResponse.json({ ok: true, authed });
  } catch (error) {
    const message = getErrorMessage(error);
    const isMissingTable = message.includes("public.leads") || message.includes("schema cache");
    const isBadJson = message === "JSON không hợp lệ.";
    return NextResponse.json(
      {
        error: isMissingTable
          ? "Form liên hệ chưa có bảng leads trong Supabase. Vui lòng gọi hotline hoặc Zalo."
          : isBadJson
          ? message
          : "Không gửi được yêu cầu tư vấn. Vui lòng gọi hotline hoặc Zalo."
      },
      { status: isMissingTable ? 503 : isBadJson ? 400 : 500 }
    );
  }
}

async function readLeadRequest(request: Request) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("JSON không hợp lệ.");
    }
    return payload as Lead;
  } catch (error) {
    if (error instanceof Error && error.message === "JSON không hợp lệ.") throw error;
    throw new Error("JSON không hợp lệ.");
  }
}

function validateLead(lead: Lead) {
  if (!lead.name?.trim() || !lead.phone?.trim()) return "Thiếu họ tên hoặc số điện thoại.";
  if (lead.name.length > 120) return "Họ tên quá dài.";
  if (lead.phone.length > 30) return "Số điện thoại quá dài.";
  if (lead.email && lead.email.length > 160) return "Email quá dài.";
  if (lead.message && lead.message.length > 1000) return "Nội dung quá dài.";
  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không gửi được yêu cầu tư vấn.";
}
