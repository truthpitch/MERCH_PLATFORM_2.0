// Prepares the SQLite database: creates its folder and applies any pending migrations.
// Runs as part of `npm run build` AND `npm start`, because some hosts (Hostinger) start
// the server themselves and never call `npm start`.
//
// Fails loudly with a readable message so a bad DATABASE_URL shows up in the build log
// instead of as a blank 500 error on the live site.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // Fall back to .env (Prisma reads it too, but this script runs before Prisma).
  const envFile = path.join(root, ".env");
  if (existsSync(envFile)) {
    const match = /^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(readFileSync(envFile, "utf8"));
    if (match) return match[1].trim();
  }
  return "";
}

function fail(message) {
  console.error(`\n✖ Database setup failed: ${message}\n`);
  process.exit(1);
}

const url = readDatabaseUrl();
if (!url) fail("DATABASE_URL is not set. Add it to your environment variables (see .env.example).");
if (!url.startsWith("file:")) fail('DATABASE_URL must start with "file:" for SQLite.');
if (url.includes("u123456789")) {
  fail('DATABASE_URL still contains the placeholder "u123456789". Replace it with your Hostinger username.');
}

// Prisma resolves relative SQLite paths from the /prisma folder.
const rawPath = url.slice("file:".length).split("?")[0];
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.join(root, "prisma", rawPath);
const dbDir = path.dirname(dbPath);

try {
  mkdirSync(dbDir, { recursive: true });
} catch (err) {
  fail(`could not create the folder ${dbDir} (${err.code ?? err.message}). Create it in File Manager or choose another path.`);
}

console.log(`• Database: ${dbPath}`);

try {
  execFileSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
} catch {
  fail("`prisma migrate deploy` did not succeed — see the Prisma output above.");
}
