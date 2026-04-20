"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { importJsonIntoShop } from "@/lib/import/importJsonIntoShop";
import { parseStrictMenuImportJson } from "@/lib/import/jsonImportSchema";

interface PasteJsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onImported: () => void;
}

const EXAMPLE_JSON = `{
  "categories": [
    { "name": "Entrées", "icon_emoji": "🥟" }
  ],
  "products": [
    {
      "name": "Gyozas poulet",
      "price": 8.5,
      "category_name": "Entrées",
      "tags": ["homemade"]
    }
  ],
  "bundles": [
    {
      "name": "Menu Bento Midi",
      "price": 19.9,
      "slots": [
        { "category_name": "Entrées", "quantity": 1 }
      ]
    }
  ]
}`;

export function PasteJsonImportDialog({
  open,
  onOpenChange,
  shopId,
  onImported,
}: PasteJsonImportDialogProps) {
  const isMobile = useIsMobile(768);
  const [rawJson, setRawJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const parseResult = useMemo(() => parseStrictMenuImportJson(rawJson), [rawJson]);
  const parseErrors = parseResult.ok ? [] : parseResult.errors;

  const counters = useMemo(() => {
    if (!parseResult.ok) {
      return { categories: 0, products: 0, bundles: 0 };
    }
    return {
      categories: parseResult.data.categories.length,
      products: parseResult.data.products.length,
      bundles: parseResult.data.bundles.length,
    };
  }, [parseResult]);

  async function handleImport() {
    if (!parseResult.ok) {
      toast.error("Le JSON est invalide. Corrigez les erreurs avant import.");
      return;
    }

    const hasData =
      counters.categories > 0 || counters.products > 0 || counters.bundles > 0;
    if (!hasData) {
      toast.error("Le JSON est valide mais vide.");
      return;
    }

    setIsImporting(true);
    const supabase = createClient();
    try {
      const result = await importJsonIntoShop(supabase, shopId, parseResult.data);
      toast.success(
        `Import terminé: ${result.categoryCount} catégorie(s), ${result.productCount} produit(s), ${result.bundleCount} formule(s).`,
        { position: "top-center" }
      );
      onImported();
      onOpenChange(false);
      setRawJson("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'import JSON.";
      toast.error(message, { position: "top-center" });
    } finally {
      setIsImporting(false);
    }
  }

  const panelContent = (
    <>
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
          Importer depuis JSON (strict)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Collez un JSON au format Bento pour importer catégories, produits et formules.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
        <Textarea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className="min-h-[300px] font-mono text-xs"
          placeholder={EXAMPLE_JSON}
          spellCheck={false}
        />

        <p className="text-xs text-muted-foreground">
          Détecté: {counters.categories} catégorie(s), {counters.products} produit(s),{" "}
          {counters.bundles} formule(s).
        </p>

        {!parseResult.ok && rawJson.trim().length > 0 && (
          <div className="max-h-40 overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-2">
            <p className="mb-1 text-xs font-medium text-destructive">
              Erreurs de validation
            </p>
            <ul className="space-y-1 text-xs text-destructive">
              {parseErrors.slice(0, 8).map((errorMsg) => (
                <li key={errorMsg}>- {errorMsg}</li>
              ))}
              {parseErrors.length > 8 && (
                <li>- … {parseErrors.length - 8} erreur(s) supplémentaire(s)</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isImporting}
        >
          Annuler
        </Button>
        <Button
          type="button"
          onClick={() => void handleImport()}
          disabled={isImporting || !parseResult.ok}
          style={{ backgroundColor: "var(--primary)" }}
          className="text-primary-foreground hover:opacity-90"
        >
          {isImporting ? "Import..." : "Importer le JSON"}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex max-h-[92vh] flex-col overflow-hidden p-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Importer depuis JSON (strict)</DrawerTitle>
          </DrawerHeader>
          {panelContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl h-full p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Importer depuis JSON (strict)</SheetTitle>
        </SheetHeader>
        {panelContent}
      </SheetContent>
    </Sheet>
  );
}
