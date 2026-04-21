"use client";

import { createContext, useContext, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getPersistedCatalogLanguages, type TabCompletionStatus } from "@/lib/catalogLanguages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const CatalogTranslationTabContext = createContext<string | null>(null);

export function useCatalogTranslationTab(): string {
  const v = useContext(CatalogTranslationTabContext);
  if (!v) {
    throw new Error("useCatalogTranslationTab must be used within TranslatableTabs");
  }
  return v;
}

function statusDot(status: TabCompletionStatus) {
  switch (status) {
    case "complete":
      return <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>●</span>;
    case "invalid":
      return <span className="text-destructive" aria-hidden>⚠</span>;
    case "partial":
      return <span className="text-amber-600 dark:text-amber-400" aria-hidden>●</span>;
    default:
      return <span className="text-muted-foreground" aria-hidden>○</span>;
  }
}

export type TranslatableTabsProps = {
  /** Langue active (code). */
  value: string;
  onValueChange: (code: string) => void;
  /** Statut d’affichage par langue (codes persistés). */
  completionByLang: Record<string, TabCompletionStatus>;
  /** Nombre de langues « complètes » (pour le sous-titre). */
  completeCount: number;
  /** Libellé au-dessus des tabs (ex. « Contenu (2/2 langues) »). */
  sectionTitle: string;
  /** Contenu par langue : reste monté (hidden) pour garder les valeurs RHF. */
  children: (langCode: string) => React.ReactNode;
  /** Bouton optionnel sous les panneaux (ex. copier depuis FR). */
  footerSlot?: React.ReactNode;
  className?: string;
};

/**
 * Onglets horizontaux scrollables (mobile) pour éditer les champs par langue.
 */
export function TranslatableTabs({
  value,
  onValueChange,
  completionByLang,
  completeCount,
  sectionTitle,
  children,
  footerSlot,
  className,
}: TranslatableTabsProps) {
  const langs = useMemo(() => getPersistedCatalogLanguages(), []);
  const total = langs.length;

  return (
    <CatalogTranslationTabContext.Provider value={value}>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{sectionTitle}</p>
          <span className="text-xs tabular-nums text-muted-foreground">
            {completeCount}/{total}
          </span>
        </div>

        <Tabs
          value={value}
          onValueChange={(v) => {
            if (typeof v === "string") onValueChange(v);
          }}
          className="w-full min-w-0"
        >
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-1 [-webkit-overflow-scrolling:touch] sm:overflow-visible">
            <TabsList
              variant="segmented"
              className="inline-flex h-11 min-h-11 w-max max-w-full flex-nowrap items-stretch justify-start gap-1"
              aria-label={sectionTitle}
            >
              {langs.map((lang) => {
                const status = completionByLang[lang.code] ?? "empty";
                return (
                  <TabsTrigger
                    key={lang.code}
                    value={lang.code}
                    title={lang.fullName}
                    className="h-full min-w-[72px] shrink-0 grow-0 basis-auto snap-start whitespace-nowrap"
                    aria-label={`${lang.fullName}${lang.isDefault ? " (langue par défaut)" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {statusDot(status)}
                      <span>{lang.tabLabel}</span>
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {langs.map((lang) => (
            <TabsContent
              key={lang.code}
              value={lang.code}
              className={cn("mt-3 space-y-4 outline-none", value !== lang.code && "hidden")}
              hidden={value !== lang.code}
              aria-hidden={value !== lang.code}
            >
              {children(lang.code)}
            </TabsContent>
          ))}
        </Tabs>

        {footerSlot ? <div className="pt-1">{footerSlot}</div> : null}
      </div>
    </CatalogTranslationTabContext.Provider>
  );
}
