import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { LOCAL_MULTI_STOREFRONT_BLUEPRINTS } from "./data/localMultiStorefrontBlueprints.mjs";

const OUTPUT_ROOT = path.resolve(process.cwd(), "public/generated/storefront-assets");
const STATE_FILE = path.resolve(process.cwd(), "scripts/.tmp/local-storefront-assets-state.json");
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const REQUEST_DELAY_MS = Number(process.env.GEMINI_IMAGE_DELAY_MS ?? 350);
const MAX_RETRIES = Number(process.env.GEMINI_IMAGE_MAX_RETRIES ?? 3);
const BASE_BACKOFF_MS = Number(process.env.GEMINI_IMAGE_BACKOFF_MS ?? 1800);

function parseEnvFile(raw) {
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
}

async function loadGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const envRaw = await readFile(path.resolve(process.cwd(), ".env.local"), "utf8");
    const env = parseEnvFile(envRaw);
    return env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? null;
  } catch {
    return null;
  }
}

function slugify(source) {
  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(target) {
  await mkdir(target, { recursive: true });
}

async function readState() {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { done: {} };
  }
}

async function writeState(state) {
  await ensureDir(path.dirname(STATE_FILE));
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function buildLogoPrompt(shop) {
  return [
    `Create a minimalist, premium restaurant brand logo for "${shop.shop_name_en}".`,
    `Audience: ${shop.audience.en}.`,
    "Style: clean vector mark + logotype, Japanese-inspired geometry, high contrast, no gradients, no photorealism.",
    "Background: transparent or plain white.",
    "Do not include mockup objects, only the logo artwork.",
    "No extra text beyond brand name.",
  ].join(" ");
}

function buildCoverPrompt(shop) {
  return [
    `Create a hero cover image for a digital storefront named "${shop.shop_name_en}".`,
    `Context: ${shop.shop_description_en}`,
    `Audience: ${shop.audience.en}.`,
    "Composition: cinematic food scene, editorial lighting, wide framing suitable for website cover.",
    "Avoid text, avoid logos, no watermark.",
    "Premium food photography style, natural colors.",
  ].join(" ");
}

function buildProductPrompt(shop, category, product) {
  return [
    `Create a high-quality product photo for a menu item.`,
    `Store: ${shop.shop_name_en}.`,
    `Category: ${category.name_en}.`,
    `Item name: ${product.name_en}.`,
    `Item description: ${product.description_en}`,
    `Visual direction: realistic food photography, appetizing, centered plate or container, clean background, subtle shadows.`,
    "No text, no watermark, no hands, no brand logos in frame.",
    "Studio style, e-commerce ready.",
  ].join(" ");
}

async function generateGeminiImageBase64({ apiKey, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => typeof part?.inlineData?.data === "string");
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini response did not include image data.");
  }
  return imagePart.inlineData.data;
}

async function writeBase64Png(filePath, base64Data) {
  const buffer = Buffer.from(base64Data, "base64");
  await writeFile(filePath, buffer);
}

async function generateOneWithRetry({ apiKey, prompt, outputFile, label }) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const base64Data = await generateGeminiImageBase64({ apiKey, prompt });
      await writeBase64Png(outputFile, base64Data);
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`${label} failed after ${MAX_RETRIES} attempts: ${error.message}`);
      }
      const backoff = BASE_BACKOFF_MS * attempt;
      console.warn(`[retry] ${label} attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      await sleep(backoff);
    }
  }
}

function buildTasks() {
  const tasks = [];
  for (const shop of LOCAL_MULTI_STOREFRONT_BLUEPRINTS) {
    const shopSlug = shop.slug ?? slugify(shop.shop_name_en);
    const shopDir = path.join(OUTPUT_ROOT, shopSlug);
    tasks.push({
      id: `${shopSlug}::logo`,
      outputFile: path.join(shopDir, "logo.png"),
      label: `${shop.shop_name_en} logo`,
      prompt: buildLogoPrompt(shop),
    });
    tasks.push({
      id: `${shopSlug}::cover`,
      outputFile: path.join(shopDir, "cover.png"),
      label: `${shop.shop_name_en} cover`,
      prompt: buildCoverPrompt(shop),
    });

    for (const category of shop.categories) {
      const categorySlug = slugify(category.name_en);
      for (const product of category.products) {
        const productSlug = slugify(product.name_en);
        tasks.push({
          id: `${shopSlug}::product::${product.key}`,
          outputFile: path.join(shopDir, "products", categorySlug, `${productSlug}.png`),
          label: `${shop.shop_name_en} / ${product.name_en}`,
          prompt: buildProductPrompt(shop, category, product),
        });
      }
    }
  }
  return tasks;
}

async function main() {
  const apiKey = await loadGeminiApiKey();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in environment or .env.local");
    process.exit(1);
  }

  const state = await readState();
  const tasks = buildTasks();
  const total = tasks.length;
  const doneSet = new Set(Object.keys(state.done ?? {}));
  const pendingTasks = tasks.filter((task) => !doneSet.has(task.id));

  console.log(`Preparing ${total} assets.`);
  console.log(`Already done: ${doneSet.size}. Pending: ${pendingTasks.length}.`);
  console.log(`Output root: ${OUTPUT_ROOT}`);

  let processed = 0;
  for (const task of pendingTasks) {
    await ensureDir(path.dirname(task.outputFile));
    await generateOneWithRetry({
      apiKey,
      prompt: task.prompt,
      outputFile: task.outputFile,
      label: task.label,
    });
    state.done[task.id] = {
      outputFile: task.outputFile,
      generatedAt: new Date().toISOString(),
    };
    processed += 1;
    if (processed % 5 === 0 || processed === pendingTasks.length) {
      await writeState(state);
      console.log(`[${doneSet.size + processed}/${total}] ${task.label}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await writeState(state);
  console.log(`Completed. Generated this run: ${processed}. Total complete: ${Object.keys(state.done).length}.`);
}

main().catch((error) => {
  console.error("Image generation failed:", error.message);
  process.exit(1);
});
