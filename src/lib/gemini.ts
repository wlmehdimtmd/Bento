import "server-only";

import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";

const MENU_EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de menus de commerces.

Analyse le contenu suivant (menu d'un commerce) et extrais TOUS les produits/articles que tu trouves.

Pour chaque produit, retourne :
- "name" : le nom du produit (court, nettoyé)
- "description" : la description si présente (sinon chaîne vide)
- "price" : le prix en nombre décimal (ex: 12.50). Si plusieurs prix (tailles), prends le prix de base.
- "category_suggestion" : dans quelle catégorie tu classerais ce produit (ex: "Entrées", "Plats", "Desserts", "Boissons", etc.)
- "tags" : tableau de tags pertinents parmi : ["végétarien", "vegan", "poisson", "fruits à coque", "gluten", "épicé", "bio", "fait maison", "sans lactose"]. Tableau vide si aucun tag ne s'applique.
- "option_label" : si le produit a visiblement des variantes/options à choisir (taille, cuisson, parfum...), indique la question. Sinon null.
- "confidence" : "high" si tu es sûr de l'extraction, "medium" si un doute, "low" si très incertain.

IMPORTANT :
- Retourne UNIQUEMENT un tableau JSON valide, sans texte autour, sans markdown.
- Si tu ne trouves aucun produit, retourne un tableau vide [].
- Les prix doivent être des nombres, pas des strings. Pas de symbole €.
- Ignore les textes décoratifs, les titres de section (utilise-les comme category_suggestion).
- Si un produit n'a pas de prix visible, mets 0 et confidence "low".

Exemple de format attendu :
[
  {
    "name": "Steak frites",
    "description": "Bavette d'Aloyau, frites maison",
    "price": 18.00,
    "category_suggestion": "Plats",
    "tags": [],
    "option_label": "Cuisson ?",
    "confidence": "high"
  }
]`;

/**
 * Modèles : d’abord les plus fiables sur l’API géné (souvent moins chers que 2.0 Pro), puis repli.
 * `gemini-2.0-flash-lite` en dernier : certaines configs réseau / régions renvoient « fetch failed » sans HTTP clair.
 * Surcharge : GEMINI_MODEL dans .env.
 */
function modelCandidates(): string[] {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  const defaultOrder = [
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];
  return [...new Set([...(fromEnv ? [fromEnv] : []), ...defaultOrder])];
}

/** Erreur réseau ou transitoire : on tente le modèle suivant au lieu d’abandonner tout de suite */
function shouldTryNextModel(err: unknown): boolean {
  if (isModelNotFound(err)) return true;
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (m.includes("fetch failed")) return true;
  if (m.includes("failed to fetch")) return true;
  if (m.includes("econnreset") || m.includes("etimedout") || m.includes("enotfound")) return true;
  if (m.includes("socket hang up") || m.includes("und_err")) return true;
  if (err instanceof GoogleGenerativeAIFetchError) {
    const s = err.status;
    if (typeof s === "number" && s >= 500 && s <= 599) return true;
  }
  return false;
}

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) s = fence[1].trim();
  return s;
}

function extractJsonArray(text: string): string | null {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

/** Nettoie trailing commas simples avant ] ou } */
function relaxJson(s: string): string {
  return s.replace(/,\s*([}\]])/g, "$1");
}

export function parseExtractedProductsJson(rawText: string): unknown {
  const slice = extractJsonArray(rawText) ?? stripCodeFences(rawText);
  try {
    return JSON.parse(slice);
  } catch {
    try {
      return JSON.parse(relaxJson(slice));
    } catch {
      return null;
    }
  }
}

type ContentPart =
  | string
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function isModelNotFound(err: unknown): boolean {
  if (err instanceof GoogleGenerativeAIFetchError) {
    if (err.status === 404) return true;
  }
  const m = err instanceof Error ? err.message : String(err);
  return (
    /\b404\b/.test(m) &&
    (/model/i.test(m) || /not\s*found/i.test(m) || /NOT_FOUND/i.test(m))
  );
}

function readResponseText(
  result: Awaited<
    ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>
  >
): string {
  try {
    return result.response.text();
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(
      `GEMINI_RESPONSE:La réponse de l’IA a été bloquée ou est vide (${detail}). Essayez une autre photo, un PDF avec texte sélectionnable, ou réessayez plus tard.`
    );
  }
}

async function generateText(apiKey: string, userParts: ContentPart[]): Promise<string> {
  const parts: ContentPart[] = [MENU_EXTRACTION_PROMPT, ...userParts];
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = modelCandidates();
  let lastErr: unknown;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
      });
      const result = await model.generateContent(parts);
      return readResponseText(result);
    } catch (e) {
      lastErr = e;
      if (e instanceof Error && e.message.startsWith("GEMINI_RESPONSE:")) {
        throw e;
      }
      if (e instanceof GoogleGenerativeAIFetchError) {
        if (e.status === 401) {
          throw new Error(
            "GEMINI_AUTH:Clé API refusée (401). Créez une clé sur https://aistudio.google.com/apikey et mettez-la dans GOOGLE_GEMINI_API_KEY."
          );
        }
        if (e.status === 403) {
          throw new Error(
            "GEMINI_AUTH:Accès refusé (403). Vérifiez que l’API « Generative Language » est activée et que la clé n’est pas restreinte à d’autres services."
          );
        }
      }
      if (isGeminiRateLimitError(e)) {
        throw e instanceof Error ? e : new Error(String(e));
      }
      if (shouldTryNextModel(e)) continue;
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(
        "GEMINI_MODEL:Aucun modèle Gemini disponible pour cette clé. Définissez GEMINI_MODEL dans .env.local (ex. gemini-1.5-flash)."
      );
}

export async function extractMenuFromImage(apiKey: string, base64: string, mimeType: string): Promise<string> {
  return generateText(apiKey, [
    { inlineData: { mimeType, data: base64 } },
    "Voici le visuel du menu (image ou capture).",
  ]);
}

export async function extractMenuFromText(apiKey: string, menuPlainText: string): Promise<string> {
  const truncated =
    menuPlainText.length > 120_000 ? `${menuPlainText.slice(0, 120_000)}\n\n[…texte tronqué]` : menuPlainText;
  return generateText(apiKey, [
    { text: `Texte extrait du document (menu) :\n\n---\n${truncated}\n---` },
  ]);
}

export function isGeminiRateLimitError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded")
  );
}
