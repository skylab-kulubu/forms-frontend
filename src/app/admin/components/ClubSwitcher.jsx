"use client";

import { clubSwitcherLinks } from "@/lib/club-switcher";

export default function ClubSwitcher() {
  return (
    <nav aria-label="Kulüp konsolları" className="space-y-1">
      {clubSwitcherLinks("forms").map((app) => (
        <a
          key={app.id}
          href={app.href}
          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
        >
          {app.label}
        </a>
      ))}
    </nav>
  );
}
