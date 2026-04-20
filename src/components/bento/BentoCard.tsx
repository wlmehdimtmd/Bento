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
        "relative overflow-hidden rounded-[var(--bento-outer-r)] border border-border bg-card [--outer-r:var(--bento-outer-r)]",
        onClick && "cursor-pointer",
        !omitSizeClasses && sizeClasses[size],
        className
      )}
    >
      {children}
    </motion.div>
  );
});
