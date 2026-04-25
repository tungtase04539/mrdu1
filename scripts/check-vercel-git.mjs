import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const configPath = fs.existsSync(path.join(os.homedir(), ".vercel", "auth.json"))
  ? path.join(os.homedir(), ".vercel", "auth.json")
  : path.join(process.env.APPDATA ?? "", "com.vercel.cli", "Data", "auth.json");

if (!fs.existsSync(configPath)) {
  console.log("Vercel auth: missing");
  process.exit(0);
}

const auth = JSON.parse(fs.readFileSync(configPath, "utf8"));
const token = auth.token;

if (!token) {
  console.log("Vercel auth: token missing");
  process.exit(0);
}

const teamsResponse = await fetch("https://api.vercel.com/v1/teams", {
  headers: { Authorization: `Bearer ${token}` }
});
const teamsPayload = await teamsResponse.json();
const team = teamsPayload.teams?.find((item) => item.slug === "tieu-anh-tungs-projects");

if (!team) {
  console.log("Vercel team: not found");
  process.exit(0);
}

const projectResponse = await fetch(`https://api.vercel.com/v9/projects/mr-du?teamId=${team.id}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const project = await projectResponse.json();

console.log(`Vercel project status: ${projectResponse.status}`);
console.log(`Project: ${project.name ?? "(unknown)"}`);
console.log(`Git repository: ${project.link?.repo ?? project.link?.repoId ?? "not connected"}`);
console.log(`Git provider: ${project.link?.type ?? "not connected"}`);
console.log(`Git org: ${project.link?.org ?? project.link?.owner ?? "not connected"}`);
console.log(`Production branch: ${project.link?.productionBranch ?? project.productionBranch ?? "unknown"}`);
