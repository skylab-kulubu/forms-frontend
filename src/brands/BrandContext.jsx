"use client";

import { createContext, useContext, useEffect } from "react";

const BrandSlots = createContext(null);
const BrandTheme = createContext(null);

export function BrandProvider({ brandKey, theme = null, scopeClass = "", slots, children }) {
  useEffect(() => {
    const root = document.body;
    const classes = scopeClass.split(" ").filter(Boolean);
    root.dataset.brand = brandKey;
    // Popups mount on the body, so they take the brand's fixed theme from there too
    if (theme) root.dataset.theme = theme;
    root.classList.add(...classes);
    return () => {
      delete root.dataset.brand;
      if (theme) delete root.dataset.theme;
      root.classList.remove(...classes);
    };
  }, [brandKey, theme, scopeClass]);

  return (
    <BrandTheme.Provider value={theme}>
      <BrandSlots.Provider value={slots}>{children}</BrandSlots.Provider>
    </BrandTheme.Provider>
  );
}

/** The theme a brand draws its pages in, whatever the visitor chose; null without a brand. */
export const useBrandTheme = () => useContext(BrandTheme);

export function BrandSlot({ name, fallback = null }) {
  return useContext(BrandSlots)?.[name] ?? fallback;
}
