"use client";

import { useState } from "react";

export function LeadForm() {
  const [status, setStatus] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(formData: FormData) {
    setStatus("Đang gửi...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { "Content-Type": "application/json" }
      });
      const payload = await safeJson(response);

      if (response.ok) {
        setSubmitted(true);
        setStatus("Đã nhận thông tin. Mr Du sẽ liên hệ lại sớm.");
        return;
      }

      setStatus(payload?.error ?? "Chưa gửi được, vui lòng gọi hotline hoặc thử lại.");
    } catch {
      setStatus("Không kết nối được server. Vui lòng gọi hotline hoặc thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={submit}>
      <label>
        Họ & Tên *
        <input name="name" required placeholder="Nguyễn Văn A" />
      </label>
      <label>
        Số Điện Thoại *
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="Số điện thoại" />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="email@example.com" />
      </label>
      <label>
        Sản phẩm quan tâm
        <select name="interest" defaultValue="">
          <option value="" disabled>
            -- Chọn --
          </option>
          <option>Yến Sào</option>
          <option>An Cung Ngưu Hoàng</option>
          <option>Sâm & Linh Chi</option>
          <option>Thực Phẩm Chức Năng</option>
          <option>Khác</option>
        </select>
      </label>
      <label>
        Nội dung
        <textarea name="message" placeholder="Nhu cầu tư vấn của bạn" />
      </label>
      <button className="button" disabled={isSubmitting || submitted} type="submit">
        {submitted ? "Đã gửi" : isSubmitting ? "Đang gửi..." : "Gửi Yêu Cầu"}
      </button>
      {status ? <p className="muted" role="status" aria-live="polite">{status}</p> : null}
    </form>
  );
}

async function safeJson(response: Response) {
  try {
    return (await response.json()) as { error?: string };
  } catch {
    return null;
  }
}
