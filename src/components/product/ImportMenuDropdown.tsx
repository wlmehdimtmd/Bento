"use client";

import { Braces, ChevronDown, Layers } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface ImportMenuDropdownProps {
  onImportTemplate: () => void;
  onImportJson?: () => void;
}

export function ImportMenuDropdown({ onImportTemplate, onImportJson }: ImportMenuDropdownProps) {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
