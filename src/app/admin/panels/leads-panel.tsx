"use client";

import { useMemo, useState } from "react";
import { LEAD_STATUSES, type LeadRecord, type LeadStatus } from "@/lib/supabase-rest";

type Props = {
  leads: LeadRecord[];
  onRefresh: () => void | Promise<void>;
};

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  converted: "Chốt đơn",
  archived: "Lưu trữ"
};

export function LeadsPanel({ leads, onRefresh }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string>();
  const [noteDraft, setNoteDraft] = useState("");
  const [handlerDraft, setHandlerDraft] = useState("");
  const [status, setStatusMessage] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!needle) return true;
      return `${lead.name} ${lead.phone} ${lead.email ?? ""} ${lead.interest ?? ""} ${lead.message ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [leads, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateStatus(lead: LeadRecord, nextStatus: LeadStatus) {
    setBusyId(lead.id);
    setStatusMessage("Đang cập nhật...");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) {
        setStatusMessage(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatusMessage(`Đã chuyển "${lead.name}" sang ${STATUS_LABELS[nextStatus]}.`);
    } catch {
      setStatusMessage("Không kết nối được server.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function saveNote(lead: LeadRecord) {
    setBusyId(lead.id);
    setStatusMessage("Đang lưu ghi chú...");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft, handled_by: handlerDraft || null })
      });
      if (!response.ok) {
        setStatusMessage(await getErrorMessage(response));
        return;
      }
      setEditingId(undefined);
      await onRefresh();
      setStatusMessage("Đã lưu ghi chú.");
    } catch {
      setStatusMessage("Không kết nối được server.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function remove(lead: LeadRecord) {
    if (!confirm(`Xoá lead "${lead.name}" (${lead.phone})?`)) return;
    setBusyId(lead.id);
    setStatusMessage("Đang xoá lead...");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusMessage(await getErrorMessage(response));
        return;
      }
      await onRefresh();
      setStatusMessage("Đã xoá lead.");
    } catch {
      setStatusMessage("Không kết nối được server.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function bulkStatus(nextStatus: LeadStatus) {
    if (selectedIds.size === 0) return;
    if (!confirm(`Chuyển ${selectedIds.size} leads sang trạng thái ${STATUS_LABELS[nextStatus]}?`)) return;
    setStatusMessage("Đang cập nhật hàng loạt...");
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus })
        });
      }
      setSelectedIds(new Set());
      await onRefresh();
      setStatusMessage("Đã cập nhật hàng loạt.");
    } catch {
      setStatusMessage("Lỗi bulk update.");
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xoá ${selectedIds.size} leads? Thao tác không thể hoàn tác.`)) return;
    setStatusMessage("Đang xoá hàng loạt...");
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/leads/${id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      await onRefresh();
      setStatusMessage("Đã xoá hàng loạt.");
    } catch {
      setStatusMessage("Lỗi bulk delete.");
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    window.location.href = `/api/leads/export?${params.toString()}`;
  }

  function startEdit(lead: LeadRecord) {
    setEditingId(lead.id);
    setNoteDraft(lead.note ?? "");
    setHandlerDraft(lead.handled_by ?? "");
  }

  return (
    <div className="admin-panel-body">
      <header className="admin-panel-header">
        <div>
          <p className="eyebrow">Leads</p>
          <h2>Khách tư vấn & yêu cầu liên hệ</h2>
          <p className="lead">Theo dõi trạng thái, ghi chú xử lý, gán người phụ trách và xuất CSV theo bộ lọc.</p>
        </div>
        <div className="admin-header-actions">
          <button className="ghost-button" type="button" onClick={exportCsv}>
            Xuất CSV
          </button>
        </div>
      </header>

      <div className="admin-filter-bar">
        <label className="admin-filter-search">
          Tìm kiếm
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, số điện thoại, email, nội dung..." />
        </label>
        <label className="admin-filter-select">
          Trạng thái
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">Tất cả</option>
            {LEAD_STATUSES.map((stat) => (
              <option key={stat} value={stat}>
                {STATUS_LABELS[stat]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-bulk-bar" role="toolbar" aria-label="Bulk leads">
        <span className="muted">{selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : "Chưa chọn lead nào"}</span>
        <div className="admin-bulk-actions">
          {LEAD_STATUSES.map((stat) => (
            <button
              key={stat}
              className="ghost-button"
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => bulkStatus(stat)}
            >
              → {STATUS_LABELS[stat]}
            </button>
          ))}
          <button className="ghost-button" type="button" disabled={selectedIds.size === 0} onClick={bulkDelete}>
            Xoá
          </button>
        </div>
      </div>

      <div className="admin-lead-grid">
        {paged.length === 0 ? (
          <p className="muted">Không có lead khớp bộ lọc.</p>
        ) : (
          paged.map((lead) => (
            <article key={lead.id} className={`admin-lead-card status-${lead.status}`}>
              <header>
                <label className="admin-bulk-check" aria-label={`Chọn lead ${lead.name}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                  />
                </label>
                <div>
                  <strong>{lead.name}</strong>
                  <p className="muted small">
                    {lead.phone}
                    {lead.email ? ` · ${lead.email}` : ""}
                  </p>
                  <p className="muted small">{formatDate(lead.created_at)}</p>
                </div>
                <span className={`status-chip status-chip--${lead.status}`}>{STATUS_LABELS[lead.status]}</span>
              </header>
              <dl className="admin-lead-meta">
                {lead.interest ? (
                  <div>
                    <dt>Quan tâm</dt>
                    <dd>{lead.interest}</dd>
                  </div>
                ) : null}
                {lead.message ? (
                  <div>
                    <dt>Nội dung</dt>
                    <dd>{lead.message}</dd>
                  </div>
                ) : null}
                {lead.note ? (
                  <div>
                    <dt>Ghi chú</dt>
                    <dd>{lead.note}</dd>
                  </div>
                ) : null}
                {lead.handled_by ? (
                  <div>
                    <dt>Phụ trách</dt>
                    <dd>{lead.handled_by}</dd>
                  </div>
                ) : null}
                {lead.handled_at ? (
                  <div>
                    <dt>Xử lý lúc</dt>
                    <dd>{formatDate(lead.handled_at)}</dd>
                  </div>
                ) : null}
              </dl>

              {editingId === lead.id ? (
                <div className="admin-lead-edit">
                  <label>
                    Ghi chú nội bộ
                    <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                  </label>
                  <label>
                    Người xử lý
                    <input value={handlerDraft} onChange={(event) => setHandlerDraft(event.target.value)} placeholder="Tên nhân sự" />
                  </label>
                  <div className="admin-form-actions">
                    <button className="button" type="button" disabled={busyId === lead.id} onClick={() => saveNote(lead)}>
                      Lưu ghi chú
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setEditingId(undefined)}>
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : null}

              <footer className="admin-lead-actions">
                <div className="admin-status-selector">
                  {LEAD_STATUSES.map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      className={`status-toggle${lead.status === stat ? " is-on" : ""}`}
                      disabled={busyId === lead.id}
                      onClick={() => updateStatus(lead, stat)}
                      aria-pressed={lead.status === stat}
                    >
                      {STATUS_LABELS[stat]}
                    </button>
                  ))}
                </div>
                <div className="admin-row-actions">
                  <button className="ghost-button" type="button" onClick={() => startEdit(lead)}>
                    Ghi chú
                  </button>
                  <a className="ghost-button" href={`tel:${lead.phone}`}>
                    Gọi
                  </a>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={busyId === lead.id}
                    onClick={() => remove(lead)}
                  >
                    Xoá
                  </button>
                </div>
              </footer>
            </article>
          ))
        )}
      </div>

      <footer className="admin-pagination">
        <span className="muted">
          {filtered.length} leads · trang {currentPage}/{totalPages}
        </span>
        <div className="admin-pagination-actions">
          <button className="ghost-button" type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            ← Trước
          </button>
          <button className="ghost-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
            Sau →
          </button>
        </div>
      </footer>

      {status ? (
        <p className="muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string | { message?: string } };
    return typeof payload.error === "string" ? payload.error : payload.error?.message ?? `Lỗi ${response.status}.`;
  } catch {
    return `Lỗi ${response.status}.`;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}
