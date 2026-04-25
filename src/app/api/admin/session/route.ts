import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminToken,
  getAdminSecret,
  getRateLimitInfo,
  hasAdminSecret,
  isAuthorised
} from "@/lib/admin-auth";

const RATE_LIMIT_MAX = 20;
const failures = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: Request) {
  return NextResponse.json({ ok: isAuthorised(request), configured: hasAdminSecret() });
}

export async function POST(request: Request) {
  if (!hasAdminSecret()) {
    return NextResponse.json(
      { error: "Chưa cấu hình ADMIN_PASSWORD nên CMS đang khóa." },
      { status: 503 }
    );
  }

  const clientKey = getClientKey(request);
  if (isLimited(clientKey)) {
    return NextResponse.json(
      { error: "Sai mật khẩu quá nhiều lần. Thử lại sau 1 phút." },
      { status: 429 }
    );
  }

  let payload: { password?: string } | null = null;
  try {
    payload = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }

  const password = payload?.password ?? "";
  const secret = getAdminSecret();
  if (!password || password.length !== secret.length || !timingSafeEquals(password, secret)) {
    recordFailure(clientKey);
    const info = getRateLimitInfo(request);
    return NextResponse.json(
      { error: "Sai mật khẩu CMS.", remainingAttempts: info.remaining },
      { status: 401 }
    );
  }

  failures.delete(clientKey);
  const token = createAdminToken(secret);
  const response = NextResponse.json({ ok: true, expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

function timingSafeEquals(left: string, right: string) {
  const l = Buffer.from(left);
  const r = Buffer.from(right);
  if (l.length !== r.length) return false;
  return crypto.timingSafeEqual(l, r);
}

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isLimited(key: string) {
  const current = failures.get(key);
  if (!current) return false;
  if (Date.now() > current.resetAt) {
    failures.delete(key);
    return false;
  }
  return current.count >= RATE_LIMIT_MAX;
}

function recordFailure(key: string) {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || now > current.resetAt) {
    failures.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
}
