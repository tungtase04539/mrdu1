import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_FAILED_ATTEMPTS = 20;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export const ADMIN_SESSION_COOKIE = "mrdu_admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 2;

export function getAdminSecret() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function hasAdminSecret() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function validateAdminRequest(request: Request) {
  if (!hasAdminSecret()) {
    return NextResponse.json({ error: "Chưa cấu hình ADMIN_PASSWORD nên CMS đang khóa thao tác ghi." }, { status: 503 });
  }

  const clientKey = getClientKey(request);
  if (isLimited(clientKey)) {
    return NextResponse.json({ error: "Thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại." }, { status: 429 });
  }

  if (isAuthorised(request)) {
    failedAttempts.delete(clientKey);
    return null;
  }

  recordFailure(clientKey);
  return NextResponse.json({ error: "Sai mật khẩu quản trị hoặc phiên đã hết hạn." }, { status: 401 });
}

export function isAuthorised(request: Request) {
  const secret = getAdminSecret();
  if (!secret) return false;

  const headerValue = request.headers.get("x-admin-password");
  if (headerValue && safeEquals(headerValue, secret)) return true;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = extractCookie(cookieHeader, ADMIN_SESSION_COOKIE);
  if (cookieToken && verifyAdminToken(cookieToken, secret)) return true;

  return false;
}

export function createAdminToken(secret: string = getAdminSecret()) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${issuedAt}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string, secret: string = getAdminSecret()) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedRaw, expiresRaw, signature] = parts;
  if (!issuedRaw || !expiresRaw || !signature) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${issuedRaw}.${expiresRaw}`).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

function extractCookie(cookieHeader: string, name: string) {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    if (rawKey?.trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
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

export async function hasServerAdminSession() {
  const secret = getAdminSecret();
  if (!secret) return false;
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token, secret);
}

export function getRateLimitInfo(request: Request) {
  const key = getClientKey(request);
  const info = failedAttempts.get(key);
  if (!info || Date.now() > info.resetAt) return { count: 0, remaining: MAX_FAILED_ATTEMPTS };
  return { count: info.count, remaining: Math.max(0, MAX_FAILED_ATTEMPTS - info.count) };
}
