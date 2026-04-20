import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  extractMenuFromImage,
  extractMenuFromText,
  isGeminiRateLimitError,
  parseExtractedProductsJson,
} from "@/lib/gemini";

export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
const MAX_PRODUCTS_RETURNED = 50;

/** JSON court Gemini : name, description, price, category — champs optionnels étendus encore acceptés */
const ExtractedProductSchema = z
  .object({
    name: z.coerce.string().min(1).max(200),
    description: z.union([z.string(), z.number(), z.null()]).optional(),
    price: z.coerce.number().min(0).max(10_000),
    category: z.coerce.string().max(100).optional(),
    category_suggestion: z.coerce.string().max(100).optional(),
    tags: z.array(z.string()).max(20).optional(),
    option_label: z.union([z.string().max(200), z.null()]).optional(),
    confidence: z.enum(["high", "medium", "low"]).optional(),
  })
  .transform((p) => {
    const desc =
      p.description === null || p.description === undefined
        ? ""
        : String(p.description);
    const rawCat = (p.category_suggestion || p.category || "Autres").trim();
    const category_suggestion = (rawCat.length > 0 ? rawCat : "Autres").slice(0, 100);
    return {
      name: String(p.name).slice(0, 200),
      description: desc.slice(0, 500),
      price: p.price,
      category_suggestion,
      tags: p.tags ?? [],
      option_label: p.option_label ?? null,
      confidence: p.confidence ?? "medium",
    };
  });

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

function normalizeProducts(raw: unknown): z.infer<typeof ExtractedProductSchema>[] {
  if (!Array.isArray(raw)) return [];
  const out: z.infer<typeof ExtractedProductSchema>[] = [];
  for (const item of raw) {
    const r = ExtractedProductSchema.safeParse(item);
    if (r.success) out.push(r.data);
  }
  return out;
}

async function runExtraction(
  apiKey: string,
  file: File,
  base64: string
): Promise<string> {
  const isPdf = file.type === "application/pdf";
  if (isPdf) {
    const buf = Buffer.from(base64, "base64");
    const parser = new PDFParse({ data: buf });
    try {
      let parsed: Awaited<ReturnType<PDFParse["getText"]>>;
      try {
        parsed = await parser.getText();
      } catch {
        throw new Error("PDF_LECTURE");
      }
      const text = (parsed.text ?? "").trim();
      if (!text) {
        throw new Error("PDF_VIDE");
      }
      return withTimeout(extractMenuFromText(apiKey, text), TIMEOUT_MS);
    } finally {
      try {
        await parser.destroy();
      } catch {
        /* ignore */
      }
    }
  }
  const mime =
    file.type && ALLOWED_TYPES.includes(file.type)
      ? file.type
      : "image/jpeg";
  return withTimeout(extractMenuFromImage(apiKey, base64, mime), TIMEOUT_MS);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    const error =
      process.env.NODE_ENV === "production"
        ? "L'import automatique du menu n'est pas activé sur ce serveur."
        : "Import IA : ajoutez GOOGLE_GEMINI_API_KEY dans votre fichier d'environnement (Google AI Studio).";
    return NextResponse.json({ error }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Fichier requis (champ « file »)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error:
          "Format non supporté. Formats acceptés : JPG, PNG, WebP, GIF, HEIC, PDF.",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (maximum 10 Mo)." },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  let rawText: string;
  try {
    rawText = await runExtraction(apiKey, file, base64);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TIMEOUT") {
      return NextResponse.json(
        { error: "Délai dépassé (30 s). Réessayez avec un fichier plus léger." },
        { status: 408 }
      );
    }
    if (err instanceof Error && err.message === "PDF_VIDE") {
      return NextResponse.json(
        { error: "Impossible d'extraire du texte de ce PDF." },
        { status: 422 }
      );
    }
    if (err instanceof Error && err.message === "PDF_LECTURE") {
      return NextResponse.json(
        {
          error:
            "Lecture du PDF impossible (fichier protégé, ou menu scanné sans texte sélectionnable). Essayez une photo nette du menu ou un PDF avec du texte copiable.",
        },
        { status: 422 }
      );
    }
    if (err instanceof Error && err.message.startsWith("GEMINI_RESPONSE:")) {
      return NextResponse.json(
        { error: err.message.slice("GEMINI_RESPONSE:".length) },
        { status: 422 }
      );
    }
    if (err instanceof Error && err.message.startsWith("GEMINI_AUTH:")) {
      return NextResponse.json(
        { error: err.message.slice("GEMINI_AUTH:".length) },
        { status: 401 }
      );
    }
    if (err instanceof Error && err.message.startsWith("GEMINI_MODEL:")) {
      return NextResponse.json(
        { error: err.message.slice("GEMINI_MODEL:".length) },
        { status: 503 }
      );
    }
    if (isGeminiRateLimitError(err)) {
      return NextResponse.json(
        {
          error:
            "Limite Google Gemini atteinte (trop de requêtes ou quota gratuit épuisé). Attendez 1 à 2 minutes, évitez les double-clics, puis réessayez. Si ça revient souvent : activez la facturation ou vérifiez les quotas sur Google AI Studio / Google Cloud.",
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    console.error("[import-menu]", err);
    const detail =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Erreur lors de l'analyse du fichier.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  let parsed: unknown = parseExtractedProductsJson(rawText);
  // Un seul nouvel appel Gemini si le JSON n’a pas pu être parsé (évite 2× coût / 429 sur réponse [] valide)
  if (parsed === null && rawText.length > 0) {
    try {
      rawText = await runExtraction(apiKey, file, base64);
      parsed = parseExtractedProductsJson(rawText);
    } catch {
      /* ignore */
    }
  }
  let products = normalizeProducts(parsed);

  let warning: string | undefined;
  if (products.length > MAX_PRODUCTS_RETURNED) {
    warning = `Seuls les ${MAX_PRODUCTS_RETURNED} premiers produits sont renvoyés (limite par import).`;
    products = products.slice(0, MAX_PRODUCTS_RETURNED);
  }

  if (products.length === 0) {
    return NextResponse.json({
      products: [],
      message: "Aucun produit détecté sur ce document.",
    });
  }

  return NextResponse.json({ products, warning });
}
