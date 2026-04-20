"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  bucket: "shop-assets" | "product-images";
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
  /** Désactive l’upload (ex. playground onboarding sans Supabase). */
  simulationDisabled?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 0.5;

export function ImageUploader({
  bucket,
  currentUrl,
  onUpload,
  onRemove,
  label = "Image",
  hint,
  hideLabel = false,
  className,
  simulationDisabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        setError("Format non supporté. Utilisez JPG, PNG ou WebP.");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        // Compress
        const compressed = await imageCompression(file, {
          maxSizeMB: MAX_SIZE_MB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // Generate unique path
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, { contentType: file.type, upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        onUpload(publicUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de l'upload."
        );
      } finally {
        setUploading(false);
      }
    },
    [bucket, onUpload]
  );

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) upload(files[0]);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  if (simulationDisabled) {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideLabel && (
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium">{label}</p>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        )}
        <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4">
          <p className="text-xs text-muted-foreground text-center">
            Pas d&apos;upload en mode simulation (aucun appel Supabase).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!hideLabel && (
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium">{label}</p>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}

      {currentUrl ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border bg-muted group">
          <Image
            src={currentUrl}
            alt={label}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Changer"
              )}
            </Button>
            {onRemove && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) =>
            e.key === "Enter" && !uploading && inputRef.current?.click()
          }
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            dragging
              ? "border-[var(--color-bento-accent)] bg-orange-50/40 dark:bg-orange-950/20"
              : "border-border bg-muted/40 hover:border-muted-foreground/40",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground text-center px-4">
            {uploading
              ? "Compression et upload en cours…"
              : "Glissez une image ou cliquez pour sélectionner"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            JPG, PNG, WebP — max 500 KB après compression
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
