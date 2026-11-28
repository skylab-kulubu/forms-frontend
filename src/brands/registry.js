import "./brands.css";
import { buildBrand } from "./engine";
import artlab from "./artlab/brand";

const BRANDS = {
  artlab: buildBrand("artlab", artlab),
};

export const brandList = Object.values(BRANDS);

if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
  for (const brand of brandList) for (const warning of brand.warnings) console.warn(`Brand "${brand.key}": ${warning}`);
}

export function findBrand(key) {
  return key && Object.hasOwn(BRANDS, key) ? BRANDS[key] : null;
}
