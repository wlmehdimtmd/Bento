"use client";

import { forwardRef } from "react";
import { BentoCard } from "./BentoCard";
import { BackNavFace, backNavAccentGradientStyle } from "./BackNavFace";

export interface BentoCardBackProps {
  categoryName: string;
  categoryEmoji: string;
  description?: string | null;
  onBack: () => void;
}

export const BentoCardBack = forwardRef<HTMLDivElement, BentoCardBackProps>(function BentoCardBack(
  { categoryName, categoryEmoji, description, onBack },
  ref
) {
  return (
    <BentoCard
      ref={ref}
      size="2x1"
      onClick={onBack}
      className="sticky top-2 z-20 h-full min-h-0 self-start"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={backNavAccentGradientStyle}
      />

      <BackNavFace
        density="full"
        categoryName={categoryName}
        categoryEmoji={categoryEmoji}
        description={description}
      />
    </BentoCard>
  );
});
