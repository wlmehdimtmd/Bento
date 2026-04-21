import type { ReactNode } from "react";

export type CatalogDashboardPageIntro = {
  pageTitle: string;
  introCopy: string;
  /** Texte discret sous le titre (ex. quota « 3 / 50 labels »). */
  titleMeta?: string;
};

type CatalogDashboardPageHeaderProps = CatalogDashboardPageIntro & {
  actions: ReactNode;
};

export function CatalogDashboardPageHeader({
  pageTitle,
  introCopy,
  titleMeta,
  actions,
}: CatalogDashboardPageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {pageTitle}
          </h1>
          {titleMeta ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{titleMeta}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
        {introCopy}
      </p>
    </div>
  );
}
