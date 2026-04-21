"use client";

import { Braces, ChevronDown, Layers, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Réactiver l’import IA depuis ce menu quand la fonctionnalité sera prête. */
export const AI_MENU_IMPORT_ENABLED = false;

interface ImportMenuDropdownProps {
  onImportTemplate: () => void;
  onImportJson?: () => void;
  /** Si true, l’entrée IA devient active (utiliser avec `onImportAi`). */
  aiEnabled?: boolean;
  onImportAi?: () => void;
}

export function ImportMenuDropdown({
  onImportTemplate,
  onImportJson,
  aiEnabled = AI_MENU_IMPORT_ENABLED,
  onImportAi,
}: ImportMenuDropdownProps) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex shrink-0 gap-1.5 whitespace-nowrap"
        )}
      >
        {t("dashboard.import.trigger", "Import")}
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
          {t("dashboard.import.fromTemplate", "Import from template")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="whitespace-nowrap"
          onClick={() => {
            onImportJson?.();
          }}
        >
          <Braces />
          {t("dashboard.import.fromJson", "Paste JSON")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="whitespace-nowrap"
          disabled={!aiEnabled}
          onClick={() => {
            if (aiEnabled) onImportAi?.();
          }}
        >
          <Sparkles />
          {t("dashboard.import.fromAi", "Import my menu with AI")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
