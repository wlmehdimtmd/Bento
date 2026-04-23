"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BENTO_GRID_BASE_CLASS } from "./bentoGridConstants";

export { BENTO_GRID_BASE_CLASS, BENTO_GRID_SURFACE_CLASS } from "./bentoGridConstants";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/** Conteneur pour orchestrer les `itemVariant` des `BentoCard` (entrée en fondu + léger décalage). */
export const BENTO_STAGGER_CONTAINER_VARIANTS = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <motion.div
      variants={BENTO_STAGGER_CONTAINER_VARIANTS}
      initial="hidden"
      animate="show"
      className={cn(
        BENTO_GRID_BASE_CLASS,
        "justify-center",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
