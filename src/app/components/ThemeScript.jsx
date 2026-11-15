"use client";

import { ThemeScript as SkylcnThemeScript } from "@skylab-kulubu/skylcn-ui";

// A client file, so the root layout (a server component) never pulls skylcn's barrel into the server graph
export default function ThemeScript() {
  return <SkylcnThemeScript />;
}
