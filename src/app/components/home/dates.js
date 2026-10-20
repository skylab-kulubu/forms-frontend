"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function formatDay(offset, options = { day: "numeric", month: "long" }) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", ...options });
}

export function useDay(offset, options) {
  return useSyncExternalStore(subscribe, () => formatDay(offset, options), () => "");
}
