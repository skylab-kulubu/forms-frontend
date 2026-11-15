"use client";

import { ArrowDown, ArrowUp, ClipboardCheck, Crown, Eye, PencilLine, Repeat2, UserX } from "lucide-react";
import { StatusDot as Dot, badgeVariants, cn } from "@skylab-kulubu/skylcn-ui";
import { effectiveFormSettings } from "@/lib/form-settings";

const COLUMN_TYPE = "text-2xs font-medium";
export const COLUMN_LABEL = `${COLUMN_TYPE} text-subtle-foreground`;

const FEATURES = [
  { key: "allowMultipleResponses", Icon: Repeat2, on: "Birden fazla cevap açık", managed: "Akışta tekrar başlatma açık" },
  { key: "allowAnonymousResponses", Icon: UserX, on: "Anonim cevap açık" },
  { key: "requiresManualReview", Icon: ClipboardCheck, on: "Manuel onay gerekli", managed: "Akıştaki adımda manuel onay açık" },
];

export function FeatureIcons({ form, className = "" }) {
  const settings = effectiveFormSettings(form);
  const items = FEATURES.filter((f) => settings[f.key]);
  if (items.length === 0) return null;

  // A span, so it can sit in a row's subtitle line, which is a paragraph
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      {items.map(({ key, Icon, on, managed }) => (
        <span key={key} title={settings.managedByWorkflow && managed ? managed : on} className="relative z-10 inline-flex">
          <Icon size={11} className="text-skylab-400" strokeWidth={1.75} />
        </span>
      ))}
    </span>
  );
}

/** The square icon at the start of a list row: a form, a flow, a template. */
export function IconTile({ icon: Icon, className = "" }) {
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground ${className}`}>
      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

export function StatusDot({ form }) {
  const { isOpen, managedByWorkflow } = effectiveFormSettings(form);
  const label = isOpen ? "Aktif form" : managedByWorkflow ? "Akış bu formda cevap almıyor" : "Pasif form";
  return <Dot tone={isOpen ? "success" : "danger"} label={label} className="relative z-10" />;
}

export function EventChip({ event }) {
  if (!event?.href) return null;
  return (
    <a href={event.href} target="_blank" rel="noreferrer" title={`Etkinliği aç: ${event.name || event.id}`} onClick={(e) => e.stopPropagation()}
      className={cn(badgeVariants({ tone: "brand" }), "relative z-10 block max-w-48 truncate transition-colors hover:border-skylab-300/60")}
    >
      {event.name || "Etkinlik"}
    </a>
  );
}

export function SortHeader({ label, field, sortField, sortDirection, onSort, align = "center", title, visibility = "flex" }) {
  const active = sortField === field;
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  return (
    <button type="button" onClick={() => onSort?.(field)} title={title}
      className={`group/sort ${visibility} ${justify} min-w-0 items-center gap-1 rounded ${COLUMN_TYPE} outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring ${active ? "text-secondary-foreground" : "text-subtle-foreground hover:text-secondary-foreground"}`}
    >
      {label ? <span className="truncate">{label}</span> : null}
      {active ? (
        sortDirection === "asc"
          ? <ArrowUp size={11} strokeWidth={2} className="shrink-0 text-skylab-300" />
          : <ArrowDown size={11} strokeWidth={2} className="shrink-0 text-skylab-300" />
      ) : (
        <span className="size-1 shrink-0 rounded-full bg-faint-foreground transition-colors group-hover/sort:bg-muted-foreground" />
      )}
    </button>
  );
}

export const ROLE_MARK = {
  3: { label: "Sahip", Icon: Crown, text: "text-secondary-foreground", icon: "text-skylab-300" },
  2: { label: "Editör", Icon: PencilLine, text: "text-secondary-foreground", icon: "text-muted-foreground" },
  1: { label: "Okuyucu", Icon: Eye, text: "text-subtle-foreground", icon: "text-subtle-foreground" },
};

export function RoleBadge({ role }) {
  const { label, Icon, text, icon } = ROLE_MARK[role] ?? ROLE_MARK[1];
  return (
    <span className={`inline-flex items-center gap-1.5 text-2xs ${text}`}>
      <Icon size={12} strokeWidth={1.75} className={`shrink-0 ${icon}`} />
      {label}
    </span>
  );
}

export const formatUpdatedAt = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (dayDiff === 0 || dayDiff === 1) {
    const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `${dayDiff === 0 ? "Bugün" : "Dün"}, ${time}`;
  }
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }) });
};
