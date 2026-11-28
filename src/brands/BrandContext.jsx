"use client";

import { createContext, useContext, useEffect } from "react";

const BrandSlots = createContext(null);

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

  return <BrandSlots.Provider value={slots}>{children}</BrandSlots.Provider>;
}

export function FixedTheme({ theme, children }) {
  useEffect(() => {
    document.body.dataset.theme = theme;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
}

export function BrandSlot({ name, fallback = null }) {
  return useContext(BrandSlots)?.[name] ?? fallback;
}
