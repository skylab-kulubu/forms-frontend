import { findBrand } from "./registry";

const FONT_SAMPLE = "Aa Ğğ Iı İi Şş Çç Öö Üü";
const FONT_WAIT_MS = 800;

export async function loadBrandFonts(key) {
  const fonts = findBrand(key)?.fontLoads;
  if (!fonts?.length || typeof document === "undefined" || !document.fonts?.load) return;
  await Promise.race([
    Promise.all(fonts.map((font) => document.fonts.load(font, FONT_SAMPLE))).catch(() => null),
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
  ]);
}

export default function BrandPaper({ brand, className = "", children }) {
  const skin = findBrand(brand);
  if (!skin) return className ? <div className={className}>{children}</div> : children;

  return <div data-brand={skin.key} data-brand-paper="" className={`${className || "contents"} ${skin.scopeClass}`}>{children}</div>;
}
