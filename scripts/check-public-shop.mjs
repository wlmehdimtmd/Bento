#!/usr/bin/env node
/**
 * Diagnostic vitrine : variables d’environnement + visibilité d’un slug
 * (clé anonyme comme un visiteur, optionnellement service role pour l’état réel).
 *
 * Usage : npm run check:shop -- le-cordonnier-bavard
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const slug = process.argv[2];
if (!slug || slug.startsWith("-")) {
  console.error("Usage: npm run check:shop -- <slug-boutique>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("Fichier .env.local introuvable à la racine du projet.");
  process.exit(1);
}

/** @type {Record<string, string>} */
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- Variables (.env.local) ---");
console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "défini" : "MANQUANT");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", anon ? "défini" : "MANQUANT");
console.log("SUPABASE_SERVICE_ROLE_KEY:", service ? "défini (diagnostic étendu)" : "absent");

if (!url || !anon) {
  console.error("\nCorrigez .env.local : l’URL et la clé anon sont requises pour l’app.");
  process.exit(1);
}

const anonClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: anonRow, error: anonErr } = await anonClient
  .from("shops")
  .select("id, slug, is_active, name")
  .eq("slug", slug)
  .maybeSingle();

console.log("\n--- Visibilité avec la clé anonyme (comme un visiteur) ---");
if (anonErr) {
  console.error(anonErr.message);
} else if (!anonRow) {
  console.log("Aucune ligne : slug absent, boutique inactive, ou autre blocage RLS.");
} else {
  console.log(JSON.stringify(anonRow, null, 2));
}

if (service) {
  const svcClient = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: srow, error: sErr } = await svcClient
    .from("shops")
    .select("id, slug, is_active, name")
    .eq("slug", slug)
    .maybeSingle();

  console.log("\n--- État en base (service role) ---");
  if (sErr) console.error(sErr.message);
  else if (!srow) console.log("Aucune ligne pour ce slug (vérifiez l’orthographe).");
  else {
    console.log(JSON.stringify(srow, null, 2));
    if (srow.is_active === false) {
      console.log(
        "\n=> La boutique existe mais is_active = false : activez-la (Supabase ou admin) pour la vitrine publique anonyme."
      );
    }
  }
} else {
  console.log(
    "\nPour comparer avec l’état brut en base, ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (ne jamais l’exposer au client)."
  );
}
