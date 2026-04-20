import { z } from "zod";

import { isFrenchPublicHoliday } from "./frenchPublicHolidays";

/** Clés 0–6 = dimanche–samedi (comme `Date.getDay()`). */
export const OPENING_DAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
export type OpeningDayKey = (typeof OPENING_DAY_KEYS)[number];

const timeHm = z.string().regex(/^\d{2}:\d{2}$/, "Heure au format HH:mm");

const daySlotSchema = z.object({
  open: timeHm,
  close: timeHm,
});

const dayScheduleSchema = z
  .object({
    closed: z.boolean(),
    slots: z.array(daySlotSchema).max(4),
  })
  .superRefine((val, ctx) => {
    if (val.closed) {
      if (val.slots.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: "Un jour fermé ne doit pas avoir de créneaux.",
          path: ["slots"],
        });
      }
      return;
    }
    if (val.slots.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Ajoutez au moins un créneau ou marquez le jour comme fermé.",
        path: ["slots"],
      });
      return;
    }
    for (let i = 0; i < val.slots.length; i++) {
      const o = hmToMinutes(val.slots[i].open);
      const c = hmToMinutes(val.slots[i].close);
      if (o >= c) {
        ctx.addIssue({
          code: "custom",
          message: "Chaque créneau doit finir après son début (pas de passage minuit).",
          path: ["slots", i, "close"],
        });
      }
    }
  });

export const shopOpeningHoursDocSchema = z.object({
  weekly: z.record(z.string(), dayScheduleSchema),
});

export type ShopOpeningHoursDoc = z.infer<typeof shopOpeningHoursDocSchema>;
export type DaySchedule = z.infer<typeof dayScheduleSchema>;

const WEEKDAY_LONG_EN: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const PHYSICAL_MODES = new Set(["dine_in", "takeaway", "a_emporter", "sur_place"]);

export function hasPhysicalFulfillment(modes: string[]): boolean {
  return modes.some((m) => PHYSICAL_MODES.has(m));
}

export function isDeliveryOnlyShop(modes: string[]): boolean {
  if (modes.length === 0) return true;
  return modes.every((m) => m === "delivery");
}

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function formatHmFr(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  return `${h}h${m === 0 ? "" : String(m).padStart(2, "0")}`;
}

/** Parties calendaires et horaires dans un fuseau IANA. */
export function getZonedParts(
  date: Date,
  timeZone: string
): { y: number; m: number; d: number; hour: number; minute: number; weekday: OpeningDayKey } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });
  const parts = dtf.formatToParts(date);
  const map: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const wn = map.weekday;
  const weekdayNum = wn != null ? WEEKDAY_LONG_EN[wn] : 0;
  const weekday = String(weekdayNum) as OpeningDayKey;
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday,
  };
}

export function parseShopOpeningHours(raw: unknown): ShopOpeningHoursDoc | null {
  const r = shopOpeningHoursDocSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export type ShopOpenStateMode = "hidden" | "unknown" | "open" | "closed";

export interface ShopOpenState {
  mode: ShopOpenStateMode;
  /** Sous-titre court (ex. créneaux du jour, prochaine ouverture). */
  subtitle?: string;
}

function dayScheduleFor(
  weekly: ShopOpeningHoursDoc["weekly"],
  weekday: OpeningDayKey
): DaySchedule | null {
  const d = weekly[weekday];
  if (d) return d;
  return null;
}

function isOpenAtMinutes(day: DaySchedule | null, minutes: number): boolean {
  if (!day || day.closed) return false;
  for (const s of day.slots) {
    const o = hmToMinutes(s.open);
    const c = hmToMinutes(s.close);
    if (minutes >= o && minutes < c) return true;
  }
  return false;
}

function slotsLabel(day: DaySchedule | null): string | undefined {
  if (!day || day.closed || day.slots.length === 0) return undefined;
  return day.slots.map((s) => `${formatHmFr(s.open)}–${formatHmFr(s.close)}`).join(", ");
}

function isClosedByHoliday(
  y: number,
  m: number,
  d: number,
  openOnPublicHolidays: boolean
): boolean {
  if (openOnPublicHolidays) return false;
  return isFrenchPublicHoliday(y, m, d);
}

/**
 * État ouvert / fermé pour la vitrine.
 * @param openingHoursJson Valeur brute `shops.opening_hours` (jsonb).
 */
export function getShopOpenState(input: {
  fulfillmentModes: string[];
  openingHoursJson: unknown | null;
  openingTimezone: string;
  openOnPublicHolidays: boolean;
  now?: Date;
}): ShopOpenState {
  const now = input.now ?? new Date();
  const modes = input.fulfillmentModes;

  if (!hasPhysicalFulfillment(modes) || isDeliveryOnlyShop(modes)) {
    return { mode: "hidden" };
  }

  const doc = input.openingHoursJson
    ? parseShopOpeningHours(input.openingHoursJson)
    : null;
  if (!doc || Object.keys(doc.weekly).length === 0) {
    return { mode: "unknown", subtitle: "Horaires non renseignés" };
  }

  const tz = input.openingTimezone || "Europe/Paris";
  const z = getZonedParts(now, tz);

  if (isClosedByHoliday(z.y, z.m, z.d, input.openOnPublicHolidays)) {
    return {
      mode: "closed",
      subtitle: "Jour férié — fermé",
    };
  }

  const minutes = z.hour * 60 + z.minute;
  const today = dayScheduleFor(doc.weekly, z.weekday);

  if (isOpenAtMinutes(today, minutes)) {
    return {
      mode: "open",
      subtitle: slotsLabel(today) ? `Aujourd’hui · ${slotsLabel(today)}` : "Ouvert",
    };
  }

  // Fermé maintenant : prochaine ouverture (créneau futur aujourd’hui ou jour suivant ouvrable / non férié)
  const hint = nextOpeningHint(doc, tz, input.openOnPublicHolidays, z);
  return {
    mode: "closed",
    subtitle: hint ?? "Fermé",
  };
}

function nextOpeningHint(
  doc: ShopOpeningHoursDoc,
  timeZone: string,
  openOnPublicHolidays: boolean,
  zToday: ReturnType<typeof getZonedParts>
): string | undefined {
  const minutes = zToday.hour * 60 + zToday.minute;
  const todaySchedule = dayScheduleFor(doc.weekly, zToday.weekday);

  if (todaySchedule && !todaySchedule.closed) {
    for (const s of todaySchedule.slots) {
      const o = hmToMinutes(s.open);
      if (o > minutes) {
        return `Ouvre à ${formatHmFr(s.open)}`;
      }
    }
  }

  for (let delta = 1; delta <= 14; delta++) {
    const { y, m, d } = addCalendarDaysZoned(zToday.y, zToday.m, zToday.d, delta);
    if (!openOnPublicHolidays && isFrenchPublicHoliday(y, m, d)) continue;

    const instant = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const zp = getZonedParts(instant, timeZone);
    const day = dayScheduleFor(doc.weekly, zp.weekday);
    if (!day || day.closed) continue;
    const first = day.slots[0];
    if (!first) continue;
    const labelDay = delta === 1 ? "demain" : weekdayLabelFr(zp.weekday);
    return `Ouvre ${labelDay} à ${formatHmFr(first.open)}`;
  }
  return undefined;
}

function addCalendarDaysZoned(
  y: number,
  m: number,
  d: number,
  delta: number
): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function weekdayLabelFr(wd: OpeningDayKey): string {
  const labels: Record<OpeningDayKey, string> = {
    "0": "dimanche",
    "1": "lundi",
    "2": "mardi",
    "3": "mercredi",
    "4": "jeudi",
    "5": "vendredi",
    "6": "samedi",
  };
  return `le ${labels[wd]}`;
}

/** Document vide prédéfini (tous les jours fermés) pour l’éditeur marchand. */
export function emptyOpeningHoursDoc(): ShopOpeningHoursDoc {
  const weekly: ShopOpeningHoursDoc["weekly"] = {};
  for (const k of OPENING_DAY_KEYS) {
    weekly[k] = { closed: true, slots: [] };
  }
  return { weekly };
}
