/**
 * Jours fériés métropole France (calendrier civil + fêtes mobiles liées à Pâques).
 * Utilisé pour la règle « fermé les jours fériés » côté horaires boutique.
 */

/** Dimanche de Pâques (calendrier grégorien), mois 1–12. */
export function easterSundayGregorian(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  deltaDays: number
): { y: number; m: number; d: number } {
  const utc = Date.UTC(year, month - 1, day + deltaDays, 12, 0, 0);
  const dt = new Date(utc);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** Dates (mois 1–12, jour) des fêtes mobiles pour une année civile. */
function movableFrenchHolidayDates(year: number): { m: number; d: number }[] {
  const e = easterSundayGregorian(year);
  const out: { m: number; d: number }[] = [];
  // Lundi de Pâques
  out.push(addCalendarDays(year, e.month, e.day, 1));
  // Ascension (jeudi, 39 jours après le dimanche de Pâques)
  out.push(addCalendarDays(year, e.month, e.day, 39));
  // Lundi de Pentecôte (50 jours après Pâques)
  out.push(addCalendarDays(year, e.month, e.day, 50));
  return out;
}

const FIXED_FR_HOLIDAYS: { m: number; d: number }[] = [
  { m: 1, d: 1 },
  { m: 5, d: 1 },
  { m: 5, d: 8 },
  { m: 7, d: 14 },
  { m: 8, d: 15 },
  { m: 11, d: 1 },
  { m: 11, d: 11 },
  { m: 12, d: 25 },
];

/**
 * Indique si la date civile donnée est un jour férié en métropole France.
 * @param month Mois 1–12
 * @param day Jour du mois
 */
export function isFrenchPublicHoliday(year: number, month: number, day: number): boolean {
  for (const { m, d } of FIXED_FR_HOLIDAYS) {
    if (m === month && d === day) return true;
  }
  for (const { m, d } of movableFrenchHolidayDates(year)) {
    if (m === month && d === day) return true;
  }
  return false;
}
