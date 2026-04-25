import fs from "node:fs";

const env = loadEnv(".env.local");
const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=*&limit=3`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  }
});
const rows = await response.json();

console.log(`status=${response.status}`);
console.log(`rows=${Array.isArray(rows) ? rows.length : 0}`);
console.log(`keys=${Object.keys(rows?.[0] ?? {}).join(",")}`);
console.log(`sample=${JSON.stringify(rows?.[0] ?? {}).slice(0, 1000)}`);

function loadEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  for (const rawLine of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, index)] = value;
  }
  return env;
}
