export const DEFAULT_SHORT_ORIGIN = "https://skyl.app";
export const DEFAULT_CORE_API_URL = "https://api.yildizskylab.com";

export function shortOrigin(env = process.env.NEXT_PUBLIC_SHORT_ORIGIN) {
  const raw = String(env || "").trim();
  return (raw || DEFAULT_SHORT_ORIGIN).replace(/\/+$/, "");
}

export function coreApiUrl(env = process.env.NEXT_PUBLIC_CORE_API_URL) {
  const raw = String(env || "").trim();
  return (raw || DEFAULT_CORE_API_URL).replace(/\/+$/, "");
}

export function publicShortUrl(alias, origin = shortOrigin()) {
  const slug = String(alias || "").trim();
  if (!slug) return "";
  return `${origin}/${slug}`;
}

export function normalizeDest(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

export function existingShortFor(url, alias, rows) {
  const dest = normalizeDest(url);
  const slug = String(alias || "").trim();
  if (!Array.isArray(rows)) return undefined;
  return rows.find((row) => (slug && row.alias === slug) || (dest && normalizeDest(row.url) === dest));
}

export async function shortenFormUrl({ listMine, create }, url) {
  const dest = normalizeDest(url);
  if (!dest) {
    const err = new Error("Form adresi yok.");
    err.status = 400;
    throw err;
  }
  let rows = [];
  try {
    rows = await listMine();
  } catch (err) {
    if (err?.status !== 403) throw err;
  }
  const existing = existingShortFor(dest, "", rows);
  if (existing) return existing;
  try {
    return await create({ url: dest });
  } catch (err) {
    if (err?.status !== 409) throw err;
    try {
      rows = await listMine();
    } catch {
      rows = [];
    }
    const again = existingShortFor(dest, "", rows);
    if (again) return again;
    throw err;
  }
}
