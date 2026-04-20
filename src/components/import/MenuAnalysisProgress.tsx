"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  "Fichier reçu",
  "Lecture du contenu",
  "Extraction des produits",
  "Structuration des données",
] as const;

interface MenuAnalysisProgressProps {
  onCancel: () => void;
}

export function MenuAnalysisProgress({ onCancel }: MenuAnalysisProgressProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [fakePct, setFakePct] = useState(12);

  useEffect(() => {
    const i = window.setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
      setFakePct((p) => Math.min(p + 9 + Math.random() * 12, 92));
    }, 900);
    return () => window.clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-bento-accent)]" />
        </motion.div>
        <p className="font-heading text-base font-medium">L&apos;IA analyse votre menu…</p>
        <p className="text-xs text-muted-foreground">Cela peut prendre quelques secondes (max. 30 s)</p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-[var(--color-bento-accent)]"
            initial={{ width: "8%" }}
            animate={{ width: `${Math.round(fakePct)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Étapes</p>
        <ul className="space-y-1.5">
          {STEPS.map((label, idx) => (
            <li key={label} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center">
                {idx < activeStep ? "✅" : idx === activeStep ? "🔄" : "○"}
              </span>
              <span className={idx === activeStep ? "text-foreground font-medium" : ""}>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
