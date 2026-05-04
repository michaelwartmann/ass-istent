/* eslint-disable no-console */
// One-shot: pre-seed empty coach rows so they can self-set their password
// on first login (the /login form switches into "needsSetup" mode when
// password_hash is null). Idempotent — re-running skips existing names.
//
// Usage: npx tsx scripts/add-coach.ts Sebastian Jonas

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.warn(`Could not read .env.local at ${path}:`, err);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const names = process.argv.slice(2).map((n) => n.trim()).filter(Boolean);
if (names.length === 0) {
  console.error("Usage: npx tsx scripts/add-coach.ts <Name1> [Name2] ...");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  for (const name of names) {
    const { data: existing } = await supabase
      .from("coaches")
      .select("id, password_hash")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      const state = existing.password_hash ? "password set" : "awaiting password";
      console.log(`= ${name} already exists (${state}) — skipping`);
      continue;
    }

    const { data, error } = await supabase
      .from("coaches")
      .insert({ name, password_hash: null })
      .select("id")
      .single();
    if (error || !data) {
      console.error(`! ${name} insert failed:`, error);
      process.exit(1);
    }
    console.log(`+ ${name} created (${data.id}) — will set password on first login`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
