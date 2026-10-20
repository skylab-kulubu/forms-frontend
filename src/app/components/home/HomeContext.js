"use client";

import { createContext, useCallback, useContext } from "react";
import { scrollToSection } from "./usePager";

export const HomeContext = createContext({ pager: null, trial: null });

export function useHome() {
  return useContext(HomeContext);
}

export function useScrollTo() {
  const { pager } = useHome();
  return useCallback(
    (target) => {
      const el = typeof target === "string" ? document.getElementById(target) : target;
      scrollToSection(pager, el);
    },
    [pager]
  );
}

export function useOpenTrial() {
  const { trial } = useHome();
  return useCallback(() => trial?.current?.(), [trial]);
}
