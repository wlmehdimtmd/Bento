"use client";

import { useRef, useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf";

interface MenuUploadZoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function MenuUploadZone({ disabled, onFile }: MenuUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function validateAndEmit(file: File) {
    const ALLOWED = ACCEPT.split(",");
    const MAX = 10 * 1024 * 1024;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format non supporté — JPG, PNG, WebP, GIF, HEIC ou PDF");
      return;
    }
    if (file.size > MAX) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    onFile(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndEmit(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !disabled) validateAndEmit(f);
        }}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-sm transition-colors",
          dragging
            ? "border-[var(--color-bento-accent)] bg-[var(--color-bento-accent)]/5 text-[var(--color-bento-accent)]"
            : "border-border text-muted-foreground hover:border-[var(--color-bento-accent)] hover:text-[var(--color-bento-accent)]",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <Upload className="h-5 w-5" />
        </div>
        <span className="font-medium text-foreground">Glissez une photo ou un PDF</span>
        <span className="text-xs">ou cliquez pour choisir un fichier</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, HEIC, PDF · max 10 Mo</span>
      </button>
    </>
  );
}
