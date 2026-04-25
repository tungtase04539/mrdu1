import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const adminError = validateAdminRequest(request);
  if (adminError) {
    return adminError;
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 1_000_000) {
    return NextResponse.json({ error: "Ảnh phải nhỏ hơn 5MB." }, { status: 413 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Thiếu CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET." }, { status: 503 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get("file");

    if (!(file instanceof File) && typeof file !== "string") {
      return NextResponse.json({ error: "Thiếu file upload." }, { status: 400 });
    }

    const validationError = await validateUpload(file);
    if (validationError) {
      return validationError;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "mr-du/products";
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    body.append("timestamp", String(timestamp));
    body.append("api_key", apiKey);
    body.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(20_000)
    });
    const payload = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json({ error: payload?.error?.message ?? "Cloudinary không nhận ảnh." }, { status: response.status });
    }

    return NextResponse.json({
      secure_url: payload?.secure_url,
      public_id: payload?.public_id,
      width: payload?.width,
      height: payload?.height,
      format: payload?.format
    });
  } catch {
    return NextResponse.json({ error: "Không upload được ảnh. Vui lòng thử lại." }, { status: 502 });
  }
}

async function validateUpload(file: File | string) {
  if (file instanceof File) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF." }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Ảnh phải nhỏ hơn 5MB." }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!hasValidImageSignature(bytes, file.type)) {
      return NextResponse.json({ error: "Nội dung file ảnh không hợp lệ." }, { status: 415 });
    }

    return null;
  }

  const match = file.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return NextResponse.json({ error: "Data URL ảnh không hợp lệ." }, { status: 415 });
  }

  const approximateBytes = Math.floor((match[2].length * 3) / 4);
  if (approximateBytes <= 0 || approximateBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Ảnh phải nhỏ hơn 5MB." }, { status: 413 });
  }

  const bytes = Buffer.from(match[2], "base64").subarray(0, 16);
  if (!hasValidImageSignature(bytes, match[1])) {
    return NextResponse.json({ error: "Nội dung data URL ảnh không hợp lệ." }, { status: 415 });
  }

  return null;
}

async function safeJson(response: Response) {
  try {
    return (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      width?: number;
      height?: number;
      format?: string;
      error?: { message?: string };
    };
  } catch {
    return null;
  }
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/gif") return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  if (mimeType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}
