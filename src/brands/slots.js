import "server-only";
import { findBrand } from "./registry";
import * as artlab from "./artlab/slots";

const PLACES = ["CardTop", "StatusTop"];

const SLOTS = {
  artlab,
};

for (const [key, slots] of Object.entries(SLOTS)) {
  if (!findBrand(key)) throw new Error(`Brand "${key}": slots are registered in slots.js, but registry.js has no brand with this key`);
  for (const [name, Slot] of Object.entries(slots)) {
    if (!PLACES.includes(name)) throw new Error(`Brand "${key}": slots.jsx exports "${name}"; it may only export ${PLACES.map((place) => `"${place}"`).join(", ")}`);
    if (typeof Slot !== "function") throw new Error(`Brand "${key}": the "${name}" slot must be a component`);
  }
}

export function brandSlots(key) {
  return Object.hasOwn(SLOTS, key) ? SLOTS[key] : {};
}
