import localFont from "next/font/local";

export const artlabSans = localFont({
  src: "./manrope.woff2",
  weight: "200 800",
  variable: "--font-artlab-sans",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-family", value: "Manrope" }],
});

export const artlabDisplay = localFont({
  src: "./unbounded.woff2",
  weight: "600 800",
  variable: "--font-artlab-display",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-family", value: "Unbounded" }],
});
