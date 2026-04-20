"use client";

import { ChevronDown, Layers, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Réactiver l’import IA depuis ce menu quand la fonctionnalité sera prête. */
export const AI_MENU_IMPORT_ENABLED = false;

interface ImportMenuDropdownProps {
  onImportTemplate: () => void;
  /** Si true, l’entrée IA devient active (utiliser avec `onImportAi`). */
  aiEnabled?: boolean;
  onImportAi?: () => void;
}

export function ImportMenuDropdown({
  onImportTemplate,
  aiEnabled = AI_MENU_IMPORT_ENABLED,
  onImportAi,
}: ImportMenuDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex shrink-0 gap-1.5 whitespace-nowrap"
        )}
      >
        Importer
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuItem
          className="whitespace-nowrap"
          onClick={() => {
            onImportTemplate();
          }}
        >
          <Layers />
          Importer depuis un modèle
        </DropdownMenuItem>
        <DropdownMenuItem
          className="whitespace-nowrap"
          disabled={!aiEnabled}
          onClick={() => {
            if (aiEnabled) onImportAi?.();
          }}
        >
          <Sparkles />
          Importer mon menu avec l&apos;IA
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
