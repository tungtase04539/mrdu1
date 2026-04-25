import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const isProd = process.argv.includes("--prod");
const target = isProd ? "production" : "preview";

// ---------- Auth ----------
const authCandidates = [
  path.join(os.homedir(), ".vercel", "auth.json"),
  path.join(process.env.APPDATA ?? "", "com.vercel.cli", "Data", "auth.json"),
  path.join(os.homedir(), ".config", "com.vercel.cli", "auth.json")
];
const authPath = authCandidates.find((p) => p && fs.existsSync(p));
if (!authPath) {
  console.error("Vercel auth.json not found. Run `vercel login` first.");
  process.exit(1);
}
const { token } = JSON.parse(fs.readFileSync(authPath, "utf8"));
if (!token) {
  console.error("Vercel token missing from auth.json");
  process.exit(1);
}

// ---------- Project ----------
const projectInfo = JSON.parse(fs.readFileSync(".vercel/project.json", "utf8"));
const { projectId, orgId, projectName } = projectInfo;
const API = "https://api.vercel.com";

const baseHeaders = { Authorization: `Bearer ${token}` };

function withTeam(url) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}teamId=${orgId}`;
}

async function api(urlPath, init = {}) {
  const res = await fetch(withTeam(`${API}${urlPath}`), {
    ...init,
    headers: { ...baseHeaders, ...(init.headers ?? {}) }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${urlPath} :: ${text}`);
  return text ? JSON.parse(text) : null;
}

// ---------- Ignore logic ----------
const alwaysIgnore = [".git", ".next", "node_modules", ".vercel", ".tools", "out", "dist"];
const extraPatterns = [
  /^\.env($|\.local$|.*\.local$)/,
  /^.*-debug\.log$/,
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^tsconfig\.tsbuildinfo$/
];

function isIgnored(rel) {
  const norm = rel.replace(/\\/g, "/");
  const parts = norm.split("/");
  if (parts.some((p) => alwaysIgnore.includes(p))) return true;
  const base = parts.at(-1) ?? "";
  if (extraPatterns.some((re) => re.test(base))) return true;
  if (base === ".env.example") return false;
  return false;
}

function walk(dir = ".", acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(".", full).replace(/\\/g, "/");
    if (isIgnored(rel)) continue;
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push(rel);
  }
  return acc;
}

// ---------- Upload files ----------
console.log(`Target: ${target}`);
console.log(`Project: ${projectName} (${projectId})`);
const files = walk(".");
console.log(`Scanning ${files.length} source files…`);

const fileRecords = [];
let uploaded = 0;
for (const rel of files) {
  const data = fs.readFileSync(rel);
  const sha = crypto.createHash("sha1").update(data).digest("hex");
  const uploadRes = await fetch(withTeam(`${API}/v2/files`), {
    method: "POST",
    headers: {
      ...baseHeaders,
      "Content-Length": String(data.length),
      "x-vercel-digest": sha
    },
    body: data
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed for ${rel}: ${uploadRes.status} ${errText}`);
  }
  fileRecords.push({ file: rel, sha, size: data.length });
  uploaded += 1;
  if (uploaded % 20 === 0) console.log(`  uploaded ${uploaded}/${files.length}`);
}
console.log(`Uploaded ${uploaded}/${files.length} files.`);

// ---------- Create deployment ----------
console.log("Creating deployment…");
const deployment = await api("/v13/deployments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: projectName,
    project: projectId,
    target,
    files: fileRecords,
    projectSettings: {
      framework: "nextjs",
      nodeVersion: "24.x"
    }
  })
});

console.log(`Created: https://${deployment.url}`);
console.log(`Inspector: ${deployment.inspectorUrl ?? "(n/a)"}`);

// ---------- Poll ----------
const deploymentId = deployment.id;
let last = deployment.readyState;
let settled = false;
for (let i = 0; i < 180; i += 1) {
  await new Promise((r) => setTimeout(r, 5000));
  const status = await api(`/v13/deployments/${deploymentId}`);
  if (status.readyState !== last) {
    console.log(`  → ${status.readyState}`);
    last = status.readyState;
  }
  if (["READY", "ERROR", "CANCELED"].includes(status.readyState)) {
    settled = true;
    if (status.readyState !== "READY") {
      console.error(`Deployment failed: ${status.readyState}`);
      process.exit(1);
    }
    console.log(`Deployment ready: https://${status.url}`);
    if (isProd) {
      const alias = status.aliasAssigned ? (status.alias ?? []) : [];
      for (const a of alias) console.log(`  alias: https://${a}`);
    }
    break;
  }
}

if (!settled) {
  console.error("Deployment did not settle within timeout window.");
  process.exit(1);
}
