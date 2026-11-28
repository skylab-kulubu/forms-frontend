"use client";

import { createContext, useContext, useEffect } from "react";

const BrandSlots = createContext(null);

export function BrandProvider({ attributes, theme = null, slots, children }) {
  useEffect(() => {
    const root = document.body;
    const marks = Object.entries(attributes);
    for (const [name, value] of marks) root.setAttribute(name, value);
    // Popups mount on the body, so they take the brand's fixed theme from there too
    if (theme) root.dataset.theme = theme;
    return () => {
      for (const [name] of marks) root.removeAttribute(name);
      if (theme) delete root.dataset.theme;
    };
  }, [attributes, theme]);

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
