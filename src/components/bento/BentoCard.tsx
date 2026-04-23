"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { itemVariant } from "./BentoGrid";

export type BentoSize = "1x1" | "2x1" | "1x2" | "2x2";

interface BentoCardProps {
  size?: BentoSize;
  /** Grille parente (ex. vitrine custom) : ne pas appliquer col-span / row-span. */
  omitSizeClasses?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  /** Carte informative fixe : pas d’agrandissement au survol. */
  disableHover?: boolean;
}

const sizeClasses: Record<BentoSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-1 sm:col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-1 sm:col-span-2 row-span-2",
};

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(function BentoCard(
  { size = "1x1", omitSizeClasses = false, className, children, onClick, disableHover = false },
  ref
) {
  return (
    <motion.div
      ref={ref}
      variants={itemVariant}
      whileHover={disableHover ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative h-[200px] w-full overflow-hidden rounded-[var(--bento-outer-r)] bg-[var(--color-bento-card-bg,var(--card))] [--outer-r:var(--bento-outer-r)] min-[351px]:w-[calc((100%-1rem)/2)] min-[351px]:min-w-[160px] min-[351px]:max-w-[240px] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]",
        "shadow-none transition-[transform,box-shadow] duration-200 ease-out",
        !disableHover &&
          "hover:shadow-[0_6px_24px_-4px_rgb(0_0_0_/_0.1)] dark:hover:shadow-[0_8px_28px_-4px_rgb(0_0_0_/_0.5)]",
        onClick && "cursor-pointer",
        !omitSizeClasses && sizeClasses[size],
        className
      )}
    >
      {children}
    </motion.div>
  );
});
