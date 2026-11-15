"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl, useTheme } from "@skylab-kulubu/skylcn-ui";

const OPTIONS = [
  { value: "dark", label: "Koyu", icon: Moon },
  { value: "light", label: "Açık", icon: Sun },
  { value: "system", label: "Sistem", icon: Monitor },
];

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();
  return <SegmentedControl options={OPTIONS} value={theme} onValueChange={setTheme} aria-label="Tema" className={className} />;
}
