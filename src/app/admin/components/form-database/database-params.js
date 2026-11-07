export const SORT_FIELDS = ["status", "title", "owner", "responseCount", "pendingCount", "lastResponseAt", "updatedAt"];
export const STATUS_OPTIONS = ["all", "open", "closed", "deleted"];
export const FLAG_KEYS = [
  ["anon", "Anonim cevap"],
  ["multi", "Çoklu cevap"],
  ["review", "Manuel inceleme"],
];

export const DB_DEFAULTS = { q: "", page: 1, sort: "updatedAt", dir: "desc", status: "all", owner: "all", anon: null, multi: null, review: null, open: null };

export function readParams(searchParams) {
  const get = (key) => searchParams?.get(key) ?? null;
  const flag = (key) => (get(key) === "1" ? true : get(key) === "0" ? false : null);
  return {
    q: get("q") ?? "",
    page: Math.max(1, Number(get("page")) || 1),
    sort: SORT_FIELDS.includes(get("sort")) ? get("sort") : DB_DEFAULTS.sort,
    dir: get("dir") === "asc" ? "asc" : "desc",
    status: STATUS_OPTIONS.includes(get("status")) ? get("status") : "all",
    owner: get("owner") || "all",
    anon: flag("anon"),
    multi: flag("multi"),
    review: flag("review"),
    open: get("open"),
  };
}

export function hrefOf(pathname, state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.sort !== DB_DEFAULTS.sort) params.set("sort", state.sort);
  if (state.dir !== DB_DEFAULTS.dir) params.set("dir", state.dir);
  if (state.status !== "all") params.set("status", state.status);
  if (state.owner !== "all") params.set("owner", state.owner);
  FLAG_KEYS.forEach(([key]) => {
    if (state[key] !== null) params.set(key, state[key] ? "1" : "0");
  });
  if (state.open) params.set("open", state.open);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function filterCount(state) {
  return [state.status !== "all", state.owner !== "all", ...FLAG_KEYS.map(([key]) => state[key] !== null)].filter(Boolean).length;
}

export function queryOf(state) {
  return {
    page: state.page,
    search: state.q || undefined,
    status: state.status === "all" ? undefined : state.status,
    owner: state.owner === "all" ? undefined : state.owner,
    allowAnonymous: state.anon,
    allowMultiple: state.multi,
    requiresManualReview: state.review,
    sortBy: state.sort,
    sortDirection: state.dir === "asc" ? "ascending" : "descending",
  };
}
