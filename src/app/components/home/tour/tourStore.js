"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export const WIDE_QUERY = "(min-width: 1280px) and (min-height: 600px) and (pointer: fine)";
export const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

const EMPTY = { mode: null, captions: [], state: "open", active: 0, note: -1, live: false, canTry: false, waiting: false, pinned: false, away: false, closing: false, shown: false, framed: false };

export function sceneName(captions, item) {
  return captions.filter((other) => other.label === item.label).length > 1 ? item.title : item.label;
}

export function createTourStore() {
  let state = EMPTY;
  const actions = { skip: null, watch: null, live: null, go: null };
  const listeners = new Set();

  return {
    get: () => state,
    set(patch) {
      if (Object.keys(patch).every((key) => patch[key] === state[key])) return;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions,
    provide(next) {
      Object.assign(actions, next);
      return () => Object.keys(next).forEach((key) => {
        if (actions[key] === next[key]) actions[key] = null;
      });
    },
  };
}

export const TourStoreContext = createContext(null);

export function useTourStore() {
  return useContext(TourStoreContext);
}

export function useTourState() {
  const store = useTourStore();
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
