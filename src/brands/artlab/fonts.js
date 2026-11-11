import { Manrope, Unbounded } from "next/font/google";

export const artlabSans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-artlab-sans",
  display: "swap",
  preload: false,
});

export const artlabDisplay = Unbounded({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-artlab-display",
  display: "swap",
  preload: false,
});
