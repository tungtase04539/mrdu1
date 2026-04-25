import { validateAdminRequest } from "@/lib/admin-auth";
import { LEAD_STATUSES, listLeads, type LeadStatus } from "@/lib/supabase-rest";

const HEADER = [
  "id",
  "created_at",
  "status",
  "name",
  "phone",
  "email",
  "interest",
  "message",
  "note",
  "handled_at",
  "handled_by"
];

export async function GET(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  let status: LeadStatus | "all" = "all";
  if (statusParam && (LEAD_STATUSES as readonly string[]).includes(statusParam)) {
    status = statusParam as LeadStatus;
  }

  const leads = await listLeads({ status, limit: 500 });
  const lines = [
    HEADER.join(","),
    ...leads.map((lead) =>
      [
        lead.id,
        lead.created_at,
        lead.status,
        lead.name,
        lead.phone,
        lead.email ?? "",
        lead.interest ?? "",
        lead.message ?? "",
        lead.note ?? "",
        lead.handled_at ?? "",
        lead.handled_by ?? ""
      ]
        .map(csvEscape)
        .join(",")
    )
  ];

  const body = "\ufeff" + lines.join("\r\n");
  const filename = `mr-du-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

function csvEscape(value: string | null | undefined) {
  const str = value == null ? "" : String(value);
  if (/["\n\r,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
