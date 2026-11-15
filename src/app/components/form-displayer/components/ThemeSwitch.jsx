"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl, useTheme } from "@skylab-kulubu/skylcn-ui";
import { useBrandTheme } from "@/brands/BrandContext";

const OPTIONS = [
  { value: "dark", label: "Koyu", icon: Moon },
  { value: "light", label: "Açık", icon: Sun },
  { value: "system", label: "Sistem", icon: Monitor },
];

// The respondent's own light or dark choice; ThemeScript in the root layout applies it before paint.
// A brand draws its page in one theme, so it has none to offer.
export default function ThemeSwitch({ className = "" }) {
  const { theme, setTheme } = useTheme();
  const brandTheme = useBrandTheme();
  if (brandTheme) return null;
  return <SegmentedControl options={OPTIONS} value={theme} onValueChange={setTheme} aria-label="Tema" className={className} />;
}
