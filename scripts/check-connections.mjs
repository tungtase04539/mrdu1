import fs from "node:fs";

const env = loadEnv(".env.local");
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "ADMIN_PASSWORD"
];

console.log("Environment");
for (const key of required) {
  console.log(`- ${key}: ${env[key] ? "present" : "missing"}`);
}

console.log(`- all keys: ${Object.keys(env).sort().join(", ") || "(none)"}`);

await checkSupabase();
await checkCloudinary();

async function checkSupabase() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("\nSupabase");
  if (!url || !key) {
    console.log("- skipped: missing URL or key");
    return;
  }

  try {
    const response = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    const body = await response.text();
    console.log(`- REST products status: ${response.status}`);
    if (!response.ok) {
      console.log(`- message: ${body.slice(0, 220)}`);
      return;
    }
    console.log("- connection: ok");
  } catch (error) {
    console.log(`- connection: failed (${error instanceof Error ? error.message : String(error)})`);
  }
}

async function checkCloudinary() {
  const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  console.log("\nCloudinary");
  console.log("- unsigned upload: skipped, signed CMS uploads only");

  const signedCloudName = env.CLOUDINARY_CLOUD_NAME || cloudName;
  if (signedCloudName && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    await uploadSigned(signedCloudName, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET);
  } else {
    console.log("- signed upload: skipped, missing cloud name, api key or api secret");
  }
}

async function uploadSigned(cloudName, apiKey, apiSecret) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "mr-du/cursor-tests";
  const signature = await sha1(`folder=${folder}&timestamp=${timestamp}${apiSecret}`);
  const form = new FormData();
  appendTestImage(form);
  form.append("folder", folder);
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();
  console.log(`- signed upload status: ${response.status}`);
  if (!response.ok) {
    console.log(`- signed message: ${JSON.stringify(payload).slice(0, 220)}`);
    return;
  }
  console.log(`- signed upload: ok (${payload.secure_url ? "secure_url returned" : "no secure_url"})`);
}

function appendTestImage(form) {
  form.append(
    "file",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
  );
}

async function sha1(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function loadEnv(path) {
  if (!fs.existsSync(path)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}
