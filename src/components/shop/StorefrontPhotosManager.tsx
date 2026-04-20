"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/product/ImageUploader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StorefrontPhotoRow = {
  id: string;
  image_url: string;
  is_visible: boolean;
  display_order: number;
  caption: string | null;
  created_at: string;
};

const MAX_PHOTOS = 5;

interface StorefrontPhotosManagerProps {
  shopId: string;
}

function isMissingStorefrontPhotosTable(message: string, code?: string) {
  return code === "PGRST205" || /shop_storefront_photos|schema cache/i.test(message);
}

function getSupabaseSqlEditorUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes("localhost")) return null;
    const projectRef = host.split(".")[0];
    if (!projectRef) return null;
    return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  } catch {
    return null;
  }
}

function toastMissingTableError() {
  const sqlUrl = getSupabaseSqlEditorUrl();
  toast.error(
    "La table « shop_storefront_photos » n'existe pas encore. Exécutez la migration SQL, attendez ~1 minute (cache schéma), puis rechargez la page.",
    {
      duration: 22000,
      ...(sqlUrl
        ? {
            action: {
              label: "Ouvrir l'éditeur SQL",
              onClick: () => window.open(sqlUrl, "_blank", "noopener,noreferrer"),
            },
          }
        : {}),
    }
  );
}

function isPhotoLimitReached(message: string) {
  return /PHOTO_LIMIT_REACHED|Maximum 5 photos/i.test(message);
}

export function StorefrontPhotosManager({ shopId }: StorefrontPhotosManagerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<StorefrontPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const canAddPhoto = photos.length < MAX_PHOTOS;

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_storefront_photos")
      .select("id, image_url, is_visible, display_order, caption, created_at")
      .eq("shop_id", shopId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      if (isMissingStorefrontPhotosTable(error.message, error.code)) {
        toastMissingTableError();
        setLoading(false);
        return;
      }
      toast.error("Impossible de charger les photos de la vitrine.");
      setLoading(false);
      return;
    }

    setPhotos((data ?? []) as StorefrontPhotoRow[]);
    setLoading(false);
  }, [shopId, supabase]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void loadPhotos();
    });
    return () => cancelAnimationFrame(frame);
  }, [loadPhotos]);

  async function handleInsertPhoto(imageUrl: string) {
    if (!canAddPhoto) {
      toast.error(`Limite atteinte : ${MAX_PHOTOS} photos maximum.`);
      return;
    }

    setUploading(true);
    const maxOrder = photos.reduce((acc, p) => Math.max(acc, p.display_order), -1);
    const { error } = await supabase.from("shop_storefront_photos").insert({
      shop_id: shopId,
      image_url: imageUrl,
      is_visible: true,
      display_order: maxOrder + 1,
    });
    setUploading(false);

    if (error) {
      console.error(error);
      if (isMissingStorefrontPhotosTable(error.message, error.code)) {
        toastMissingTableError();
        return;
      }
      if (isPhotoLimitReached(error.message)) {
        toast.error(`Limite atteinte : ${MAX_PHOTOS} photos maximum.`);
        return;
      }
      toast.error(error.message || "Impossible d'ajouter la photo.");
      return;
    }

    toast.success("Photo ajoutée à la vitrine.");
    void loadPhotos();
  }

  async function handleToggleVisibility(photo: StorefrontPhotoRow, checked: boolean) {
    setBusyId(photo.id);
    const { error } = await supabase
      .from("shop_storefront_photos")
      .update({ is_visible: checked })
      .eq("id", photo.id)
      .eq("shop_id", shopId);
    setBusyId(null);

    if (error) {
      console.error(error);
      toast.error("Mise à jour impossible.");
      return;
    }

    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, is_visible: checked } : p))
    );
  }

  async function handleDeletePhoto(photoId: string) {
    setBusyId(photoId);
    const { error } = await supabase
      .from("shop_storefront_photos")
      .delete()
      .eq("id", photoId)
      .eq("shop_id", shopId);
    setBusyId(null);

    if (error) {
      console.error(error);
      toast.error("Suppression impossible.");
      return;
    }

    toast.success("Photo supprimée.");
    void loadPhotos();
  }

  async function handleMove(photo: StorefrontPhotoRow, direction: -1 | 1) {
    const currentIndex = photos.findIndex((p) => p.id === photo.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= photos.length) return;

    const target = photos[targetIndex];
    if (!target) return;

    setBusyId(photo.id);
    const firstUpdate = supabase
      .from("shop_storefront_photos")
      .update({ display_order: target.display_order })
      .eq("id", photo.id)
      .eq("shop_id", shopId);
    const secondUpdate = supabase
      .from("shop_storefront_photos")
      .update({ display_order: photo.display_order })
      .eq("id", target.id)
      .eq("shop_id", shopId);

    const [{ error: errA }, { error: errB }] = await Promise.all([firstUpdate, secondUpdate]);
    setBusyId(null);

    if (errA || errB) {
      console.error(errA || errB);
      toast.error("Réordonnancement impossible.");
      return;
    }

    void loadPhotos();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Importez des photos pour votre vitrine publique. Vous pouvez afficher/masquer chaque photo
          individuellement.
        </p>
        <p className="text-xs text-muted-foreground">
          {photos.length} / {MAX_PHOTOS} photos
        </p>
      </div>

      {canAddPhoto ? (
        <ImageUploader
          bucket="shop-assets"
          label="Nouvelle photo vitrine"
          hint="JPG, PNG, WebP"
          onUpload={handleInsertPhoto}
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Limite atteinte ({MAX_PHOTOS} photos). Supprimez une photo pour en ajouter une nouvelle.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des photos…</p>
      ) : photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Aucune photo importée pour le moment.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Ordre</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {photos.map((photo, index) => {
              const rowBusy = busyId === photo.id;
              return (
                <TableRow key={photo.id}>
                  <TableCell>
                    <div className="relative h-14 w-24 overflow-hidden rounded-md border border-border bg-muted">
                      <Image
                        src={photo.image_url}
                        alt={photo.caption || `Photo vitrine ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={photo.is_visible}
                      onCheckedChange={(checked) => handleToggleVisibility(photo, checked)}
                      disabled={rowBusy}
                      aria-label="Afficher cette photo dans la vitrine"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={rowBusy || index === 0}
                        onClick={() => handleMove(photo, -1)}
                        aria-label="Monter la photo"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={rowBusy || index === photos.length - 1}
                        onClick={() => handleMove(photo, 1)}
                        aria-label="Descendre la photo"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        disabled={rowBusy}
                        onClick={() => handleDeletePhoto(photo.id)}
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {uploading ? (
        <p className="text-xs text-muted-foreground">Enregistrement de la photo…</p>
      ) : null}
    </div>
  );
}
