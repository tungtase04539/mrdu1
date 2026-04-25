import crypto from "node:crypto";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_FAILED_ATTEMPTS = 20;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export function validateAdminRequest(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Chưa cấu hình ADMIN_PASSWORD nên CMS đang khóa thao tác ghi." }, { status: 503 });
  }

  const clientKey = getClientKey(request);
  if (isLimited(clientKey)) {
    return NextResponse.json({ error: "Thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại." }, { status: 429 });
  }

  if (!safeEquals(request.headers.get("x-admin-password") ?? "", process.env.ADMIN_PASSWORD)) {
    recordFailure(clientKey);
    return NextResponse.json({ error: "Sai mật khẩu quản trị." }, { status: 401 });
  }

  failedAttempts.delete(clientKey);
  return null;
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isLimited(clientKey: string) {
  const current = failedAttempts.get(clientKey);
  if (!current) return false;
  if (Date.now() > current.resetAt) {
    failedAttempts.delete(clientKey);
    return false;
  }
  return current.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(clientKey: string) {
  const now = Date.now();
  const current = failedAttempts.get(clientKey);
  if (!current || now > current.resetAt) {
    failedAttempts.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  current.count += 1;
}
