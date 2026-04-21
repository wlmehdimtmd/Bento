export function seedEnglishText(sourceFr: string | null | undefined): string | null {
  const value = sourceFr?.trim();
  if (!value) return null;
  return value;
}
