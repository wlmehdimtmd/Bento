"use client";

import { useCallback, useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuImportDialog } from "@/components/import/MenuImportDialog";

interface CategoryOption {
  id: string;
  name: string;
}

interface MenuImportButtonProps {
  shopId: string;
  categories: CategoryOption[];
  onImported: () => void;
}

export function MenuImportButton({ shopId, categories, onImported }: MenuImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bootstrapFile, setBootstrapFile] = useState<File | null>(null);
  const clearBootstrap = useCallback(() => setBootstrapFile(null), []);

  return (
    <>
      <MenuImportDialog
        open={open}
        onOpenChange={setOpen}
        shopId={shopId}
        categories={categories}
        onImported={onImported}
        bootstrapFile={bootstrapFile}
        onBootstrapConsumed={clearBootstrap}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) {
            setBootstrapFile(f);
            setOpen(true);
          }
        }}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-5 text-sm transition-colors",
          dragging
            ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
            : "border-border text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)]"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <Upload className="h-4 w-4" />
        </div>
        <span className="font-medium">Importer mon menu avec l&apos;IA</span>
        <span className="text-xs text-muted-foreground">
          Glissez une photo ou un PDF — puis validez et importez
        </span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, HEIC, PDF · max 10 Mo</span>
      </button>
    </>
  );
}
