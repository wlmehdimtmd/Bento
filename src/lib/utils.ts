import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FormatPriceFractionDigits = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatPrice(
  amount: number,
  currency = "EUR",
  numberLocale: string = "fr-FR",
  fractionDigits?: FormatPriceFractionDigits
): string {
  const min = fractionDigits?.minimumFractionDigits ?? 2;
  const max = fractionDigits?.maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
