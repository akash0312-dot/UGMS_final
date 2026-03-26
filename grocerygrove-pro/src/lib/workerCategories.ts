/** Must match backend `DEFAULT_WORKER_CATEGORY_NAMES` ordering. */
export const STANDARD_WORKER_CATEGORY_ORDER = [
  "HR",
  "picker",
  "accountant",
  "loadman",
  "stock filler",
  "delivery person",
] as const;

const STANDARD_SET = new Set(
  STANDARD_WORKER_CATEGORY_ORDER.map((n) => n.toLowerCase()),
);

const ORDER_MAP = new Map(
  STANDARD_WORKER_CATEGORY_ORDER.map((name, i) => [name.toLowerCase(), i]),
);

/** Title-style label for dropdown and tables. */
export function displayWorkerCategory(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower === "hr") return "HR";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function sortWorkerCategories<T extends { id: number; name: string }>(cats: T[]): T[] {
  return [...cats].sort((a, b) => {
    const ai = ORDER_MAP.get(a.name.toLowerCase()) ?? 1000;
    const bi = ORDER_MAP.get(b.name.toLowerCase()) ?? 1000;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export function partitionStandardAndCustomCategories<T extends { id: number; name: string }>(
  cats: T[],
): { standard: T[]; custom: T[] } {
  const sorted = sortWorkerCategories(cats);
  const standard: T[] = [];
  const custom: T[] = [];
  for (const c of sorted) {
    (STANDARD_SET.has(c.name.toLowerCase()) ? standard : custom).push(c);
  }
  return { standard, custom };
}
