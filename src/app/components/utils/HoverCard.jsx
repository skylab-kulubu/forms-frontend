"use client";

import { useRef, useState } from "react";
import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "@skylab-kulubu/skylcn-ui";
import Avatar from "./Avatar";

export default function HoverCard({ user, children, openDelay = 1100, className = "" }) {
  const triggerRef = useRef(null);
  const [theme, setTheme] = useState(undefined);

  if (!user) return <div className={`relative inline-flex ${className}`}>{children}</div>;

  const email = user?.email?.trim() || "";
  const id = user?.id?.trim() || "";
  const university = user?.university?.trim() || "";
  const department = user?.department?.trim() || "";
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];
  const avatarUrl = user?.profilePictureUrl?.trim() || user?.image?.trim() || "";

  const displayName = user?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/)
    .map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR")))
    .join(" ") || "Kullanıcı";

  const rows = [
    { label: "University", value: university || "--" },
    { label: "Department", value: department || "--" },
  ];

  return (
    <PreviewCard
      onOpenChange={(open) => {
        // The card is portaled to body, so it takes the theme of the part it opened from: the landing stays dark in a light page
        if (open) setTheme(triggerRef.current?.closest("[data-theme]")?.getAttribute("data-theme") ?? undefined);
      }}
    >
      <PreviewCardTrigger delay={openDelay} render={<div ref={triggerRef} className={`relative inline-flex ${className}`} />}>
        {children}
      </PreviewCardTrigger>
      <PreviewCardContent side="bottom" align="center" sideOffset={8} data-theme={theme} className="w-80">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
          <Avatar name={displayName} email={email} photoUrl={avatarUrl} size="lg" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
            <div className="truncate text-xs text-muted-foreground">{email || "--"}</div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-start">
          <span className="p-0.5 text-3xs uppercase tracking-wide text-subtle-foreground">
            ID: {id || "--"}
          </span>
        </div>

        <div className="mt-1 grid gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="text-2xs uppercase tracking-wide text-subtle-foreground">{row.label}</span>
              <span className="text-right text-xs text-secondary-foreground break-all">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-2">
          {roles.length ? (
            <div className="mt-1 w-full rounded-md border border-border bg-muted/40 px-2 py-1 text-center text-2xs text-secondary-foreground">
              {roles[0]}
            </div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">--</div>
          )}
        </div>
      </PreviewCardContent>
    </PreviewCard>
  );
}
