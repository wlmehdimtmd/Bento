"use client";

import Image from "next/image";
import { Images } from "lucide-react";

import { cn } from "@/lib/utils";
import { BentoCard, type BentoSize } from "./BentoCard";
import type { StorefrontPhoto } from "@/lib/types";

interface BentoCardGalleryProps {
  photos: StorefrontPhoto[];
  size?: BentoSize;
  omitSizeClasses?: boolean;
  className?: string;
}

export function BentoCardGallery({
  photos,
  size = "2x1",
  omitSizeClasses = false,
  className,
}: BentoCardGalleryProps) {
  const coverPhoto = photos[0] ?? null;

  return (
    <BentoCard
      size={size}
      omitSizeClasses={omitSizeClasses}
      className={cn("relative flex h-full min-h-0 flex-col overflow-hidden", className)}
    >
      {coverPhoto ? (
        <Image
          src={coverPhoto.image_url}
          alt={coverPhoto.caption ?? "Photo vitrine"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div className="flex h-full min-h-[96px] items-center justify-center bg-muted/30">
          <Images className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
    </BentoCard>
  );
}
