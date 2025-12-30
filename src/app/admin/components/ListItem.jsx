"use client";

import Link from "next/link";
import { CornerDownRight, Eye, PencilLine, Repeat2, UserX, ChartColumn } from "lucide-react";
import ActionButton from "./utils/ActionButton";

const ROLE_STYLES = {
  3: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  2: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  default: "border-white/10 bg-white/5 text-neutral-300",
};

const ROLE_LABELS = {
  3: "Owner",
  2: "Editor",
  default: "Viewer",
};

function RoleBadge({ role }) {
  const label = ROLE_LABELS[role] ?? ROLE_LABELS.default;
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.default;

  return (
    <span className={`rounded-md border px-1 mt-1 py-0.5 text-[7px] uppercase tracking-[0.18em] ${style}`}>
      {label}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

export function ListItemSkeleton({ count = 4, className = "" }) {
  const items = Array.from({ length: count });

  return (
    <div className={`space-y-1.5 ${className}`}>
      {items.map((_, index) => (
        <div key={index} className="w-full rounded-xl border border-black/40 bg-black/15 px-4 py-1 shadow-sm backdrop-blur sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 sm:flex-[0.65]">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                <SkeletonBlock className="h-3 w-10 rounded-md" />
              </div>
              <SkeletonBlock className="mt-2 h-3 w-40 rounded-md" />
            </div>

            <div className="flex w-full justify-center sm:w-auto sm:flex-[1.35] sm:justify-start">
              <div className="w-full max-w-md rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-3.5 w-24 rounded-md" />
                  <SkeletonBlock className="h-3 w-36 rounded-md" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:ml-auto sm:justify-end">
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-7 w-9 rounded-md" />
                <SkeletonBlock className="h-7 w-7 rounded-md" />
                <SkeletonBlock className="h-7 w-7 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}

    </div>
  );
}

export default function ListItem({ form, linkedForm, viewHref, editHref, onViewResponses, onEdit, className = "" }) {
  if (!form) return null;

  const linkedId = linkedForm?.id || form.linkedFormId;
  const hasLinked = Boolean(linkedId);
  const responsesLabel = "Responses";

  return (
    <div className={`w-full rounded-xl border border-black/40 bg-black/15 px-4 py-2 shadow-sm backdrop-blur sm:px-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 sm:flex-[0.65]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-neutral-100 truncate sm:text-md">
              {form.title || "--"}
            </h3>
            <RoleBadge role={form.userRole} />
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">{form.id}</p>
        </div>

        {hasLinked ? (
          <div className="flex w-full justify-center sm:w-auto sm:flex-[1.35] sm:justify-start">
            <Link href={`/admin/forms/${linkedId}`} aria-label="Linked form" title="Linked form"
              className="flex w-full max-w-md items-start gap-2 rounded-lg border border-white/20 bg-neutral-900/90 px-3 py-2 text-[11px] text-neutral-100 transition hover:border-indigo-300/40 hover:bg-indigo-500/10"
            >
              <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300" />
              <div className="min-w-0">
                <p className="font-medium leading-tight truncate">Bağlı Form</p>
                <p className="text-[10px] text-neutral-200/70 truncate">{linkedId}</p>
              </div>
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 sm:ml-auto sm:justify-end">
          <div className="flex items-center gap-1">
            <div className="inline-flex h-7 w-9 gap-1 items-center justify-center rounded-md text-neutral-400/80">
              <ChartColumn className="h-3.5 w-3.5" />
              <span className="text-[11px]">{form.responseCount ? form.responseCount : 0}</span>
            </div>
            <div title={form.allowMultipleResponses ? "Birden fazla cevap açık" : "Birden fazla cevap kapalı"}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${form.allowMultipleResponses ? "text-indigo-300/80" : "text-neutral-500/80"}`}
            >
              <Repeat2 className="h-3.5 w-3.5" />
            </div>
            <div title={form.allowAnonymousResponses ? "Anonim cevaplar açık" : "Anonim cevaplar kapalı"}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${form.allowAnonymousResponses ? "text-indigo-300/80" : "text-neutral-500/80"}`}
            >
              <UserX className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionButton href={viewHref} onClick={onViewResponses} icon={Eye}label={responsesLabel}/>
            <ActionButton href={editHref} onClick={onEdit} icon={PencilLine} label="Edit form" variant="primary"/>
          </div>
        </div>
      </div>
    </div>
  );
}
