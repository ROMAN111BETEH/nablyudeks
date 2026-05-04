export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const value = normalized.startsWith("7") ? normalized : `7${normalized}`;

  const p1 = value.slice(1, 4);
  const p2 = value.slice(4, 7);
  const p3 = value.slice(7, 9);
  const p4 = value.slice(9, 11);

  let formatted = "+7";
  if (p1) formatted += ` (${p1}`;
  if (p1.length === 3) formatted += ")";
  if (p2) formatted += ` ${p2}`;
  if (p3) formatted += `-${p3}`;
  if (p4) formatted += `-${p4}`;

  return formatted;
}

export function onlyPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
