import artlab from "./artlab";
import { BRAND_CATALOG } from "./catalog";

const SKINS = { artlab };

export function findBrand(key) {
  if (!key || !Object.hasOwn(BRAND_CATALOG, key) || !Object.hasOwn(SKINS, key)) return null;
  return { key, ...BRAND_CATALOG[key], ...SKINS[key] };
}
