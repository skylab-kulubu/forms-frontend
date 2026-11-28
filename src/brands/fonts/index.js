import localFont from "next/font/local";

const manrope = localFont({
  src: "./manrope.woff2",
  weight: "200 800",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-family", value: "Manrope" }],
});

const unbounded = localFont({
  src: "./unbounded.woff2",
  weight: "600 800",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-family", value: "Unbounded" }],
});

export const BRAND_FONTS = {
  Manrope: manrope,
  Unbounded: unbounded,
};
