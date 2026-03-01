"use client";

import Link from "next/link";
import { ChevronRight, Clock, ClipboardCheck, CornerDownRight, LayoutList, PencilLine, Repeat2, UserX, ChartColumn, Archive, User2 } from "lucide-react";
import ActionButton from "./utils/ActionButton";

const ROLE_STYLES = {
  3: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
  2: "border-indigo-400/30 bg-indigo-400/10 text-indigo-100",
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
    <span className={`rounded-md border px-1 py-0.5 text-[7px] uppercase tracking-[0.18em] ${style}`}>
      {label}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

function Divider() {
  return <div className="hidden sm:block h-6 border-l border-white/10 shrink-0" />;
}

function FeatureIcon({ active, title, children }) {
  return (
    <div title={title} className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${active ? "text-skylab-500/80" : "text-neutral-500/80"}`}>
      {children}
    </div>
  );
}

export function ListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-full px-4 py-2.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                  <SkeletonBlock className="h-3 w-10 rounded-md" />
                </div>
                <SkeletonBlock className="mt-1.5 h-2.5 w-40 rounded-md" />
              </div>
              <Divider />
              <div className="flex items-center gap-1.5">
                <SkeletonBlock className="h-3.5 w-3.5 rounded" />
                <SkeletonBlock className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-6 w-8 rounded-md" />
                <SkeletonBlock className="h-6 w-6 rounded-md" />
                <SkeletonBlock className="h-6 w-6 rounded-md" />
                <SkeletonBlock className="h-6 w-6 rounded-md" />
              </div>
              <Divider />
              <div className="flex items-center gap-1.5">
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
              </div>
              <SkeletonBlock className="h-4 w-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const RESPONSE_STATUS_STYLES = {
  0: "hidden",
  1: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  2: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  3: "border-red-500/30 bg-red-500/10 text-red-200",
  default: "hidden",
};

const RESPONSE_STATUS_LABELS = {
  0: "Durum Yok",
  1: "Beklemede",
  2: "Onaylandı",
  3: "Reddedildi",
  default: "Durum Yok",
};

function ResponseStatusBadge({ status }) {
  const label = RESPONSE_STATUS_LABELS[status] ?? RESPONSE_STATUS_LABELS.default;
  const style = RESPONSE_STATUS_STYLES[status] ?? RESPONSE_STATUS_STYLES.default;

  return (
    <span className={`rounded-md border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${style}`}>
      {label}
    </span>
  );
}

function getInitial(name, email) {
  const source = (name || email || "").trim();
  return source ? source[0].toUpperCase() : "?";
}

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

export function ResponseListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-full px-4 py-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 sm:w-48 shrink-0">
              <SkeletonBlock className="h-9 w-9 rounded-lg" />
              <div>
                <SkeletonBlock className="h-3.5 w-24 rounded-md" />
                <SkeletonBlock className="mt-1.5 h-2.5 w-32 rounded-md" />
              </div>
            </div>
            <Divider />
            <div className="flex flex-1 items-center gap-3">
              <SkeletonBlock className="h-3 w-36 rounded-md" />
              <SkeletonBlock className="h-4 w-16 rounded-md" />
              <SkeletonBlock className="h-3 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Divider />
              <SkeletonBlock className="h-3 w-20 rounded-md" />
              <SkeletonBlock className="h-6 w-6 rounded-md" />
              <SkeletonBlock className="h-8 w-8 rounded-md" />
              <SkeletonBlock className="h-4 w-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResponseListItem({ formId, response, className = "" }) {
  if (!response) return null;

  const statusValue = Number(response.status ?? 0);
  const userName = response.user?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "Anonim Kullanıcı";
  const userId = response.user?.id || "";
  const photoUrl = response.user?.profilePictureUrl || null;
  const reviewedBy = response.reviewedBy || null;
  const reviewerName = reviewedBy?.fullName.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "--";
  const submittedAt = formatDate(response.submittedAt);
  const initial = getInitial(userName);

  const reviewText = (statusValue === 2 || statusValue === 3)
    ? `${reviewerName} tarafından incelendi.`
    : statusValue === 0
      ? "Onay aşaması bulunmamakta."
      : "Henüz incelenmedi.";

  const responseHref = `/admin/forms/${formId}/responses/${response.id}`;

  return (
    <div className={`group/row relative w-full px-4 py-2 border-b border-white/6 last:border-b-0 transition-colors hover:bg-white/5 ${className}`}>
      <Link href={responseHref} className="absolute inset-0 z-0" aria-label={userName} tabIndex={-1} />
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0 sm:w-48 shrink-0">
          <div className="h-9 w-9 rounded-lg border shrink-0 border-white/10 bg-neutral-900/60 grid place-items-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={userName} className="h-full w-full object-cover" />
            ) : response.user?.fullName ? (
              <span className="text-lg text-neutral-600">{initial}</span>
            ) : (
              <User2 size={18} className="text-neutral-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-100 truncate">{userName}</p>
            <p className="text-[10px] text-neutral-500 truncate">{userId}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <p className="text-[11px] font-medium text-neutral-300 truncate">
            <span className="text-neutral-600 mr-1">ID</span>{response.id || "--"}
          </p>
          <ResponseStatusBadge status={statusValue} />
          <span className="text-[10px] text-neutral-500 truncate">{reviewText}</span>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <Divider />
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <Clock size={12} />
            {submittedAt}
          </span>
          <div title={response.isArchived ? "Arşivlenmiş cevap" : "Arşivlenmemiş cevap"}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${response.isArchived ? "text-skylab-500/80" : "text-neutral-500/80"}`}
          >
            <Archive className="h-3.5 w-3.5" />
          </div>
          <ActionButton href={responseHref} icon={LayoutList} label="Görüntüle" />
          <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

export default function ListItem({ form, linkedForm, viewHref, editHref, onViewResponses, onEdit, className = "" }) {
  if (!form) return null;

  const linkedId = linkedForm?.id;
  const linkedTitle = linkedForm?.title || "--";
  const hasLinked = Boolean(linkedId);
  const responsesHref = viewHref ? `${viewHref}/responses` : undefined;

  return (
    <div className={`group/row relative w-full px-4 py-2.5 border-b border-white/6 last:border-b-0 transition-colors hover:bg-white/5 ${className}`}>
      {viewHref && <Link href={viewHref} className="absolute inset-0 z-0" aria-label={form.title ?? "Form"} tabIndex={-1} />}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-neutral-100 truncate">{form.title || "--"}</h3>
              <RoleBadge role={form.userRole} />
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500 truncate">{form.id}</p>
          </div>

          {hasLinked && (
            <>
              <Divider />
              <Link href={`/admin/forms/${linkedId}`} title={linkedTitle}
                className="relative z-10 group/link flex items-center gap-1.5 min-w-0 shrink"
              >
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover/link:text-indigo-300 transition-colors" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-neutral-300 group-hover/link:text-indigo-200 transition-colors">{linkedTitle}</p>
                  <p className="truncate text-[10px] text-neutral-600">{linkedId}</p>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="inline-flex h-7 gap-1 items-center justify-center rounded-md px-1 text-neutral-400/80">
              <ChartColumn className="h-3.5 w-3.5" />
              <span className="text-[11px]">{form.responseCount || 0}</span>
            </div>
            <FeatureIcon active={form.allowMultipleResponses} title={form.allowMultipleResponses ? "Birden fazla cevap açık" : "Birden fazla cevap kapalı"}>
              <Repeat2 className="h-3.5 w-3.5" />
            </FeatureIcon>
            <FeatureIcon active={form.allowAnonymousResponses} title={form.allowAnonymousResponses ? "Anonim cevaplar açık" : "Anonim cevaplar kapalı"}>
              <UserX className="h-3.5 w-3.5" />
            </FeatureIcon>
            <FeatureIcon active={form.requiresManualReview} title={form.requiresManualReview ? "Manuel onay açık" : "Manuel onay kapalı"}>
              <ClipboardCheck className="h-3.5 w-3.5" />
            </FeatureIcon>
          </div>
          <Divider />
          <div className="flex items-center gap-1.5">
            <ActionButton href={responsesHref} onClick={onViewResponses} icon={LayoutList} label="Cevaplar" />
            <ActionButton href={editHref} onClick={onEdit} icon={PencilLine} label="Düzenle" variant="primary" />
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-neutral-400" />
        </div>

      </div>
    </div>
  );
}
