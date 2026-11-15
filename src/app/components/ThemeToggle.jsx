"use client";

import { Palette } from "lucide-react";
import { MenuRadioGroup, MenuRadioItem, MenuSub, MenuSubContent, MenuSubTrigger } from "@skylab-kulubu/skylcn-ui";

const OPTIONS = [
  { value: "dark", label: "Koyu" },
  { value: "light", label: "Açık" },
  { value: "system", label: "Sistem" },
];

// Takes the choice from the shell's one useTheme: this submenu mounts only while the profile menu is open,
// and the desktop sidebar and the drawer would otherwise each keep a copy of their own.
export default function ThemeToggle({ theme, onThemeChange }) {
  return (
    <MenuSub>
      <MenuSubTrigger icon={Palette}>Tema</MenuSubTrigger>
      <MenuSubContent>
        <MenuRadioGroup value={theme} onValueChange={onThemeChange}>
          {OPTIONS.map(({ value, label }) => (
            <MenuRadioItem key={value} value={value}>{label}</MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuSubContent>
    </MenuSub>
  );
}
