"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BackNavFace, backNavAccentGradientStyle } from "./BackNavFace";

export interface BentoCardBackFloatingProps {
  open: boolean;
  categoryName: string;
  categoryEmoji: string;
  description?: string | null;
  onBack: () => void;
}

export function BentoCardBackFloating({
  open,
  categoryName,
  categoryEmoji,
  description,
  onBack,
}: BentoCardBackFloatingProps) {
  const label = `Retour aux catégories : ${categoryName}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.button
          key="bento-back-floating"
          type="button"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          onClick={onBack}
          className="fixed left-4 z-[35] max-w-[min(90vw,22rem)] cursor-pointer overflow-hidden rounded-[var(--bento-outer-r)] bg-card text-left shadow-lg backdrop-blur-md outline-none ring-offset-background transition-[transform,box-shadow] duration-200 hover:shadow-[0_10px_40px_-8px_rgb(0_0_0_/_0.18)] dark:hover:shadow-[0_12px_44px_-8px_rgb(0_0_0_/_0.55)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
          style={{
            top: "max(5.5rem, calc(env(safe-area-inset-top, 0px) + 5rem))",
          }}
          aria-label={label}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={backNavAccentGradientStyle}
          />
          <BackNavFace
            density="compact"
            categoryName={categoryName}
            categoryEmoji={categoryEmoji}
            description={description}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
