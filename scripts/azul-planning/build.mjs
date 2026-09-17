/**
 * Génère les documents du projet « Planning stratégique » d'Azul et, avec
 * `--push`, les écrit dans `pages.content.meta.raw_html` sur Supabase.
 *
 * Usage :
 *   node scripts/azul-planning/build.mjs            → écrit les HTML dans --out
 *   node scripts/azul-planning/build.mjs --push     → pousse aussi en base
 *   node scripts/azul-planning/build.mjs --out DIR  → répertoire de sortie
 *
 * Les pages restent en `meta.style = "raw_html"` : le viewer les rend dans
 * son iframe sandbox, et le mode édition, les annotations et les overrides
 * d'images continuent de fonctionner comme avant.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { DOC_PROTOCOLE } from "./doc-protocole.mjs";
import { DOC_DECK } from "./doc-deck.mjs";
import { DOC_RSSI } from "./doc-rssi.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");

const DOCS = [
  { slug: "deck-seed", html: DOC_DECK },
  { slug: "dossier-rssi", html: DOC_RSSI },
  { slug: "protocole-devaluation-de-lexactitude", html: DOC_PROTOCOLE },
];

const PROJECT_SLUG = "planning-strategique";
const CLIENT_SLUG = "azul";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return out;
}

async function main() {
  const outDir = arg("--out", path.join(ROOT, ".preview-azul"));
  fs.mkdirSync(outDir, { recursive: true });

  for (const d of DOCS) {
    const file = path.join(outDir, `${d.slug}.html`);
    fs.writeFileSync(file, d.html);
    console.log(`  ${d.slug.padEnd(38)} ${(d.html.length / 1024).toFixed(1)} Ko → ${file}`);
  }

  if (!process.argv.includes("--push")) {
    console.log("\nAperçu écrit. Ajoute --push pour publier en base.");
    return;
  }

  const env = loadEnv();
  const db = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("slug", CLIENT_SLUG)
    .maybeSingle();
  if (!profile) throw new Error(`Client ${CLIENT_SLUG} introuvable.`);

  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("slug", PROJECT_SLUG)
    .maybeSingle();
  if (!project) throw new Error(`Projet ${PROJECT_SLUG} introuvable.`);

  console.log("");
  for (const d of DOCS) {
    const { data: page } = await db
      .from("pages")
      .select("id, name, content")
      .eq("project_id", project.id)
      .eq("slug", d.slug)
      .maybeSingle();
    if (!page) {
      console.warn(`  ! page ${d.slug} introuvable — ignorée`);
      continue;
    }

    const content = {
      ...(page.content || {}),
      meta: {
        ...((page.content || {}).meta || {}),
        style: "raw_html",
        raw_html: d.html,
      },
    };

    const { error } = await db
      .from("pages")
      .update({ content })
      .eq("id", page.id);
    if (error) throw error;
    console.log(`  ✓ ${page.name} — ${(d.html.length / 1024).toFixed(1)} Ko publiés`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
