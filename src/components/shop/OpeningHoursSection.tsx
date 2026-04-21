"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  emptyOpeningHoursDoc,
  getShopOpenState,
  hasPhysicalFulfillment,
  isDeliveryOnlyShop,
  OPENING_DAY_KEYS,
  type OpeningDayKey,
  type ShopOpeningHoursDoc,
  shopOpeningHoursDocSchema,
} from "@/lib/openingHours";
import { useLocale } from "@/components/i18n/LocaleProvider";

const DAY_ORDER: OpeningDayKey[] = ["1", "2", "3", "4", "5", "6", "0"];
const DAY_LABELS: Record<OpeningDayKey, string> = {
  "1": "Lundi",
  "2": "Mardi",
  "3": "Mercredi",
  "4": "Jeudi",
  "5": "Vendredi",
  "6": "Samedi",
  "0": "Dimanche",
};

export interface OpeningHoursSectionProps {
  fulfillmentModes: string[];
  value: ShopOpeningHoursDoc;
  onChange: (next: ShopOpeningHoursDoc) => void;
  openOnPublicHolidays: boolean;
  onOpenOnPublicHolidaysChange: (v: boolean) => void;
  disabled?: boolean;
  /** Masque le titre visible (ex. onglet « Horaires » déjà libellé). */
  omitSectionTitle?: boolean;
}

function cloneDoc(doc: ShopOpeningHoursDoc): ShopOpeningHoursDoc {
  return {
    weekly: Object.fromEntries(
      OPENING_DAY_KEYS.map((k) => {
        const d = doc.weekly[k] ?? { closed: true, slots: [] };
        return [k, { closed: d.closed, slots: d.slots.map((s) => ({ ...s })) }];
      })
    ) as ShopOpeningHoursDoc["weekly"],
  };
}

export function OpeningHoursSection({
  fulfillmentModes,
  value,
  onChange,
  openOnPublicHolidays,
  onOpenOnPublicHolidaysChange,
  disabled,
  omitSectionTitle = false,
}: OpeningHoursSectionProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const showHours =
    hasPhysicalFulfillment(fulfillmentModes) && !isDeliveryOnlyShop(fulfillmentModes);

  const preview = useMemo(
    () =>
      getShopOpenState({
        fulfillmentModes,
        openingHoursJson: value,
        openingTimezone: "Europe/Paris",
        openOnPublicHolidays,
      }),
    [fulfillmentModes, value, openOnPublicHolidays]
  );

  if (!showHours) {
    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
        {omitSectionTitle ? (
          <h2 className="sr-only">Horaires vitrine</h2>
        ) : (
          <h2 className="text-lg font-semibold">{tr("Horaires d'ouverture", "Opening hours")}</h2>
        )}
        <p className="text-sm text-muted-foreground">
          {tr(
            "Les horaires magasin ne s'affichent que si vous proposez au moins un service sur place ou à emporter. Pour une activité 100 % livraison, vos clients commandent en ligne sans horaire de boutique.",
            "Store opening hours are shown only when you offer on-site or takeaway service. For delivery-only activity, customers can order online without store hours."
          )}
        </p>
      </section>
    );
  }

  function setDay(day: OpeningDayKey, patch: Partial<{ closed: boolean; slots: { open: string; close: string }[] }>) {
    const next = cloneDoc(value);
    const cur = next.weekly[day] ?? { closed: true, slots: [] };
    next.weekly[day] = {
      closed: patch.closed ?? cur.closed,
      slots: patch.slots ?? cur.slots,
    };
    onChange(next);
  }

  function setSlot(day: OpeningDayKey, index: number, field: "open" | "close", hm: string) {
    const next = cloneDoc(value);
    const cur = next.weekly[day] ?? { closed: false, slots: [] };
    const slots = cur.slots.map((s, i) => (i === index ? { ...s, [field]: hm } : s));
    next.weekly[day] = { ...cur, slots };
    onChange(next);
  }

  function addSlot(day: OpeningDayKey) {
    const next = cloneDoc(value);
    const cur = next.weekly[day] ?? { closed: false, slots: [] };
    if (cur.slots.length >= 4) return;
    next.weekly[day] = {
      closed: false,
      slots: [...cur.slots, { open: "12:00", close: "14:00" }],
    };
    onChange(next);
  }

  function removeSlot(day: OpeningDayKey, index: number) {
    const next = cloneDoc(value);
    const cur = next.weekly[day] ?? { closed: true, slots: [] };
    const slots = cur.slots.filter((_, i) => i !== index);
    next.weekly[day] = {
      closed: slots.length === 0,
      slots,
    };
    onChange(next);
  }

  function copyMondayToWeek() {
    const next = cloneDoc(value);
    const mon = next.weekly["1"] ?? { closed: true, slots: [] };
    for (const k of OPENING_DAY_KEYS) {
      if (k === "1") continue;
      next.weekly[k] = {
        closed: mon.closed,
        slots: mon.slots.map((s) => ({ ...s })),
      };
    }
    onChange(next);
  }

  function applyWeekdayTemplate() {
    const next = emptyOpeningHoursDoc();
    for (const k of ["1", "2", "3", "4", "5"] as OpeningDayKey[]) {
      next.weekly[k] = {
        closed: false,
        slots: [
          { open: "12:00", close: "14:00" },
          { open: "19:00", close: "22:00" },
        ],
      };
    }
    onChange(next);
  }

  const parsedOk = shopOpeningHoursDocSchema.safeParse(value).success;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        {omitSectionTitle ? (
          <h2 className="sr-only">Horaires vitrine</h2>
        ) : (
          <h2 className="text-lg font-semibold">{tr("Horaires d'ouverture", "Opening hours")}</h2>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={applyWeekdayTemplate} disabled={disabled}>
            {tr("Lun–Ven 12h–14h, 19h–22h", "Mon-Fri 12:00-14:00, 19:00-22:00")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copyMondayToWeek} disabled={disabled}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {tr("Copier lundi → semaine", "Copy Monday -> week")}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {tr("Fuseau horaire", "Timezone")} : <span className="font-medium text-foreground">Europe/Paris</span> ({tr("heure de Paris", "Paris time")}).
      </p>

      <div className="rounded-lg border border-border divide-y">
        {DAY_ORDER.map((day) => {
          const row = value.weekly[day] ?? { closed: true, slots: [] };
          return (
            <div key={day} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex w-full items-center justify-between gap-3 sm:w-36 sm:flex-col sm:items-start sm:justify-start">
                <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!row.closed}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDay(day, {
                          closed: false,
                          slots: row.slots.length > 0 ? row.slots : [{ open: "12:00", close: "14:00" }],
                        });
                      } else {
                        setDay(day, { closed: true, slots: [] });
                      }
                    }}
                    disabled={disabled}
                  />
                  <span className="text-xs text-muted-foreground">{row.closed ? tr("Fermé", "Closed") : tr("Ouvert", "Open")}</span>
                </div>
              </div>

              {!row.closed && (
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {row.slots.map((slot, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={slot.open}
                        onChange={(e) => setSlot(day, idx, "open", e.target.value)}
                        disabled={disabled}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        value={slot.close}
                        onChange={(e) => setSlot(day, idx, "close", e.target.value)}
                        disabled={disabled}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeSlot(day, idx)}
                        disabled={disabled}
                      >
                        {tr("Retirer", "Remove")}
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-fit"
                    onClick={() => addSlot(day)}
                    disabled={disabled || row.slots.length >= 4}
                  >
                    {tr("Ajouter un créneau", "Add time slot")}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="open-holidays" className="text-sm font-medium leading-snug cursor-pointer">
            {tr("Ouvert les jours fériés (France métropolitaine)", "Open on public holidays (mainland France)")}
          </Label>
          <Switch
            id="open-holidays"
            checked={openOnPublicHolidays}
            onCheckedChange={onOpenOnPublicHolidaysChange}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {tr(
            "Si cette option est désactivée, la boutique est affichée comme fermée les jours fériés (y compris le 1er mai et le 25 décembre). Si elle est activée, ces dates suivent les mêmes créneaux que les autres jours : seule la grille ci-dessus s'applique (par exemple un 25 décembre un dimanche utilise les horaires du dimanche).",
            "If this option is disabled, the shop is shown as closed on public holidays (including May 1st and December 25th). If enabled, those dates follow the same slots as regular days: only the grid above applies."
          )}
        </p>
      </div>

      <div
        className={cn(
          "rounded-lg border px-3 py-2 text-sm",
          preview.mode === "open" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
          preview.mode === "closed" && "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200",
          preview.mode === "unknown" && "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
          preview.mode === "hidden" && "hidden"
        )}
      >
        {!parsedOk && (
          <p className="text-destructive text-xs">
            {tr("Corrigez les créneaux (chaque fin doit être après le début, pas de passage minuit dans un même créneau).", "Fix time slots (each end time must be after start time, no midnight crossover in one slot).")}
          </p>
        )}
        {parsedOk && preview.mode === "open" && (
          <p>
            <span className="font-semibold">{tr("Ouvert", "Open")}</span>
            {preview.subtitle ? ` — ${preview.subtitle}` : ""}
          </p>
        )}
        {parsedOk && preview.mode === "closed" && (
          <p>
            <span className="font-semibold">{tr("Fermé", "Closed")}</span>
            {preview.subtitle ? ` — ${preview.subtitle}` : ""}
          </p>
        )}
        {parsedOk && preview.mode === "unknown" && <p>{preview.subtitle ?? tr("Horaires incomplets", "Incomplete hours")}</p>}
      </div>
    </section>
  );
}
