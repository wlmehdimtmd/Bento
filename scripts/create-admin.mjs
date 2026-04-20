/**
 * Crée un compte admin dans Supabase et lui assigne le rôle 'admin'.
 * Usage : ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/create-admin.mjs
 *
 * Prérequis : avoir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * dans le fichier .env.local ou les variables d'environnement.
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf-8");
    const env = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME ?? "Admin";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ ADMIN_EMAIL et ADMIN_PASSWORD sont requis (variables d'environnement).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Création du compte admin : ${ADMIN_EMAIL}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_FULL_NAME },
  });

  let userId;
  if (error) {
    if (error.message.includes("already been registered") || error.code === "email_exists") {
      console.log("ℹ️  Le compte existe déjà — mise à jour du rôle.");
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list?.users.find((u) => u.email === ADMIN_EMAIL)?.id;
    } else {
      console.error("❌ Erreur :", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Compte créé avec succès !");
    userId = data.user.id;
  }

  if (userId) {
    const { error: roleError } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("id", userId);

    if (roleError) {
      console.error("❌ Impossible d'assigner le rôle admin :", roleError.message);
    } else {
      console.log(`✅ Rôle 'admin' assigné à l'utilisateur ${userId}`);
    }
  }
}

main();
