/**
 * Server-side pagination helpers shared by every list screen (roles, users, events, registrations, …).
 * The page lives in the URL (`?page=2&size=20`), so lists are linkable and survive reloads.
 */
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export type PageRequest = {
  page: number;
  size: number;
  /** Inclusive range for Supabase `.range(from, to)`. */
  from: number;
  to: number;
};

const toInt = (value: string | string[] | undefined) => {
  const n = Number.parseInt(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''), 10);
  return Number.isFinite(n) ? n : undefined;
};

export function parsePage(
  searchParams: { page?: string | string[]; size?: string | string[] },
  defaultSize: number = DEFAULT_PAGE_SIZE,
): PageRequest {
  const rawSize = toInt(searchParams.size);
  const size = (PAGE_SIZES as readonly number[]).includes(rawSize ?? -1) ? rawSize! : defaultSize;
  const page = Math.max(1, toInt(searchParams.page) ?? 1);
  return { page, size, from: (page - 1) * size, to: page * size - 1 };
}

export type PageMeta = {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  /** 1-based index of the first / last row shown (0 when empty). */
  firstItem: number;
  lastItem: number;
};

export function pageMeta(total: number, request: Pick<PageRequest, 'page' | 'size'>): PageMeta {
  const totalPages = Math.max(1, Math.ceil(total / request.size));
  const page = Math.min(request.page, totalPages);
  const firstItem = total === 0 ? 0 : (page - 1) * request.size + 1;
  const lastItem = Math.min(total, page * request.size);
  return { page, size: request.size, total, totalPages, firstItem, lastItem };
}

/** Page numbers to render: always first and last, a window around the current page, `null` for a gap. */
export function pageWindow(page: number, totalPages: number, radius = 1): Array<number | null> {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null);
    out.push(p);
  });
  return out;
}
