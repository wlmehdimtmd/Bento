"use client";

import { useId, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  formatLocaleLinkLabel,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LanguageSelectorDialog() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
      >
        {formatLocaleLinkLabel(locale)}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>Choisir la langue</DialogTitle>
          </DialogHeader>
          <RadioGroup
            value={locale}
            aria-labelledby={titleId}
            onValueChange={(value) => {
              const nextLocale = value as AppLocale;
              setLocale(nextLocale);
              setOpen(false);
            }}
            className="space-y-2"
          >
            {SUPPORTED_LOCALES.map((entry) => (
              <Label
                key={entry}
                htmlFor={`locale-${entry}`}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer"
              >
                <RadioGroupItem id={`locale-${entry}`} value={entry} />
                <span className="text-sm font-medium">{formatLocaleLinkLabel(entry)}</span>
                <span className="text-xs text-muted-foreground ml-auto">{LOCALE_LABELS[entry]}</span>
              </Label>
            ))}
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </>
  );
}
