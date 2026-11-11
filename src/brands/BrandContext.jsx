"use client";

import { createContext, useContext, useEffect } from "react";

const BrandSlots = createContext(null);

export function BrandProvider({ brandKey, scopeClass = "", slots, children }) {
  useEffect(() => {
    const root = document.body;
    const classes = scopeClass.split(" ").filter(Boolean);
    root.dataset.brand = brandKey;
    root.classList.add(...classes);
    return () => {
      delete root.dataset.brand;
      root.classList.remove(...classes);
    };
  }, [brandKey, scopeClass]);

  return <BrandSlots.Provider value={slots}>{children}</BrandSlots.Provider>;
}

export function BrandSlot({ name, fallback = null }) {
  return useContext(BrandSlots)?.[name] ?? fallback;
}
