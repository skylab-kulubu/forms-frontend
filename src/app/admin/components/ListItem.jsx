"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, ClipboardCheck, CornerDownRight, FileText, PencilLine, Repeat2, UserX, ChartColumn, Archive } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";

const FORM_GRID = [
  "grid items-center gap-3",
  "grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_auto]",
  "sm:grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_7rem_auto]",
  "lg:grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_7rem_4rem_6.5rem_5rem]",
  "xl:grid-cols-[1.5rem_minmax(0,22rem)_minmax(0,1fr)_7rem_4rem_6.5rem_5rem]",
].join(" ");
const COLUMN_LABEL = "text-3xs font-medium uppercase tracking-[0.18em] text-neutral-600";

const RESPONSE_GRID = [
  "grid items-center gap-3",
  "grid-cols-[1.5rem_minmax(0,1fr)_3rem]",
  "sm:grid-cols-[1.5rem_minmax(0,1fr)_9rem_3rem]",
  "md:grid-cols-[1.5rem_minmax(0,1fr)_8rem_9rem_3rem]",
  "lg:grid-cols-[1.5rem_minmax(0,1fr)_7rem_8rem_9rem_3rem]",
].join(" ");

const formatPersonName = (name) =>
  name?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((w) => w.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";

const FEATURES = [
  { key: "allowMultipleResponses", Icon: Repeat2, on: "Birden fazla cevap açık" },
  { key: "allowAnonymousResponses", Icon: UserX, on: "Anonim cevap açık" },
  { key: "requiresManualReview", Icon: ClipboardCheck, on: "Manuel onay gerekli" },
];

function FeatureIcons({ form, className = "" }) {
  const items = FEATURES.filter((f) => form[f.key]);
  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {items.map(({ key, Icon, on }) => (
        <span key={key} title={on} className="relative z-10 inline-flex">
          <Icon size={11} className="text-skylab-400" strokeWidth={1.75} />
        </span>
      ))}
    </div>
  );
}

function StatusDot({ status }) {
  const active = Number(status) === 2;
  const tone = active ? "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40" : "bg-red-400 shadow-[0_0_6px] shadow-red-400/40";
  return <span title={active ? "Aktif form" : "Pasif form"} className={`relative z-10 size-1.5 shrink-0 rounded-full ${tone}`} />;
}

function LinkedFormChip({ id, title }) {
  return (
    <Link href={`/admin/forms/${id}`} title={`Bağlı forma git: ${title}`}
      className="relative z-10 flex w-full min-w-0 max-w-60 items-center gap-2 rounded-md border border-white/10 bg-white/3 px-2 py-1 transition-colors hover:border-white/20 hover:bg-white/5"
    >
      <CornerDownRight size={12} className="shrink-0 text-neutral-500" />
      <span className="min-w-0">
        <span className="block truncate text-2xs font-medium text-neutral-200">{title}</span>
        <span className="block truncate text-3xs text-neutral-500">{id}</span>
      </span>
    </Link>
  );
}

function SortHeader({ label, field, sortField, sortDirection, onSort, align = "center", title, visibility = "flex" }) {
  const active = sortField === field;
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  return (
    <button type="button" onClick={() => onSort?.(field)} title={title}
      className={`group/sort ${visibility} ${justify} items-center gap-1 ${COLUMN_LABEL} transition-colors hover:text-neutral-300 ${active ? "text-neutral-300" : ""}`}
    >
      {label ? <span className="truncate">{label}</span> : null}
      {active ? (
        sortDirection === "asc"
          ? <ArrowUp size={11} strokeWidth={2} className="shrink-0 text-skylab-300" />
          : <ArrowDown size={11} strokeWidth={2} className="shrink-0 text-skylab-300" />
      ) : (
        <span className="size-1 shrink-0 rounded-full bg-neutral-600 transition-colors group-hover/sort:bg-neutral-400" />
      )}
    </button>
  );
}

export const ROLE_BADGE = {
  3: { label: "Sahip", className: "bg-skylab-500/10 text-skylab-300 border border-skylab-400/40" },
  2: { label: "Editör", className: "bg-white/10 text-neutral-200 border border-white/20" },
  default: { label: "Görüntüleyici", className: "bg-white/5 text-neutral-400 border border-white/10" },
};

function RoleBadge({ role }) {
  const { label, className } = ROLE_BADGE[role] ?? ROLE_BADGE.default;

  return (
    <span className={`rounded-md px-1 py-0.5 text-4xs uppercase tracking-[0.18em] ${className}`}>
      {label}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

export function FormListHeader({ sortField, sortDirection, onSort }) {
  const sortProps = { sortField, sortDirection, onSort };
  return (
    <div className={`${FORM_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <SortHeader field="status" title="Duruma göre sırala" {...sortProps} />
      <span className={COLUMN_LABEL}>Form Adı</span>
      <SortHeader label="Bağlı Form" field="linkedForm" align="left" title="Bağlı forma göre sırala" {...sortProps} />
      <SortHeader label="Güncellendi" field="updatedAt" visibility="hidden sm:flex" title="Güncellenme tarihine göre sırala" {...sortProps} />
      <SortHeader label="Yanıt" field="responseCount" visibility="hidden lg:flex" title="Yanıt sayısına göre sırala" {...sortProps} />
      <SortHeader label="Yetki" field="userRole" visibility="hidden lg:flex" title="Yetkiye göre sırala" {...sortProps} />
      <span className={`text-right ${COLUMN_LABEL}`}>İşlem</span>
    </div>
  );
}

export function ListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${FORM_GRID} px-3 py-2.5`}>
          <div className="flex justify-center"><SkeletonBlock className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
            <SkeletonBlock className="h-3.5 w-40 rounded-md" />
          </div>
          <SkeletonBlock className="h-9 w-40 max-w-full rounded-md" />
          <div className="hidden justify-center sm:flex"><SkeletonBlock className="h-3 w-16 rounded-md" /></div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-3.5 w-5 rounded-md" /></div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-4 w-14 rounded-md" /></div>
          <div className="flex items-center justify-end">
            <SkeletonBlock className="h-4 w-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const RESPONSE_STATUS = {
  1: { label: "Beklemede", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40", text: "text-amber-300" },
  2: { label: "Onaylandı", dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40", text: "text-emerald-300" },
  3: { label: "Reddedildi", dot: "bg-red-400 shadow-[0_0_6px] shadow-red-400/40", text: "text-red-300" },
  default: { label: "Durumsuz", dot: "bg-neutral-600", text: "text-neutral-500" },
};

const formatUpdatedAt = (value) => {
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

export function ResponseListHeader({ sortDirection, onSort }) {
  return (
    <div className={`${RESPONSE_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <span />
      <span className={COLUMN_LABEL}>Kullanıcı</span>
      <span className={`hidden text-center lg:block ${COLUMN_LABEL}`}>Durum</span>
      <span className={`hidden md:block ${COLUMN_LABEL}`}>İnceleyen</span>
      <SortHeader label="Gönderilme" field="submittedAt" sortField="submittedAt" sortDirection={sortDirection} onSort={onSort} visibility="hidden sm:flex" title="Gönderilme tarihine göre sırala" />
      <span className={`text-right ${COLUMN_LABEL}`}>İşlem</span>
    </div>
  );
}

export function ResponseListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${RESPONSE_GRID} px-3 py-2.5`}>
          <div className="flex justify-center"><SkeletonBlock className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <SkeletonBlock className="h-3.5 w-28 rounded-md" />
              <SkeletonBlock className="mt-1.5 h-2.5 w-20 rounded-md" />
            </div>
          </div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-3 w-14 rounded-md" /></div>
          <div className="hidden md:block"><SkeletonBlock className="h-3 w-24 rounded-md" /></div>
          <div className="hidden justify-center sm:flex"><SkeletonBlock className="h-3 w-16 rounded-md" /></div>
          <div className="flex items-center justify-end"><SkeletonBlock className="h-4 w-4 rounded" /></div>
        </div>
      ))}
    </div>
  );
}

export function ResponseListItem({ formId, response, className = "" }) {
  if (!response) return null;

  const statusValue = Number(response.status ?? 0);
  const status = RESPONSE_STATUS[statusValue] ?? RESPONSE_STATUS.default;
  const userName = formatPersonName(response.user?.fullName) || "Anonim Kullanıcı";
  const userId = response.user?.id || "";
  const photoUrl = response.user?.profilePictureUrl || null;
  const reviewerName = formatPersonName(response.reviewedBy?.fullName);
  const isReviewed = statusValue === 2 || statusValue === 3;
  const submittedAt = formatUpdatedAt(response.submittedAt);

  const responseHref = `/admin/forms/${formId}/responses/${response.id}`;

  return (
    <div className={`group/row relative transition-colors hover:bg-white/3 ${className}`}>
      <Link href={responseHref} className="absolute inset-0 z-0" aria-label={userName} tabIndex={-1} />
      <div className={`${RESPONSE_GRID} px-3 py-2.5`}>

        <div className="flex justify-center">
          <span title={status.label} className={`relative z-10 size-1.5 shrink-0 rounded-full ${status.dot}`} />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={response.user?.fullName ? userName : ""} photoUrl={photoUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50">{userName}</p>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              {response.isArchived && <Archive size={10} className="shrink-0 text-skylab-500/70" />}
              <span className="truncate text-3xs text-neutral-500">{userId || "Anonim"}</span>
            </div>
          </div>
        </div>

        <div className={`hidden text-center text-2xs font-medium lg:block ${status.text}`}>
          {status.label}
        </div>

        <span className="hidden min-w-0 truncate text-2xs md:block">
          {isReviewed ? <span className="text-neutral-300">{reviewerName || "—"}</span> : <span className="text-neutral-600">{statusValue === 1 ? "Bekliyor" : "—"}</span>}
        </span>

        <span className="hidden text-center text-2xs tabular-nums text-neutral-500 sm:block">
          {submittedAt}
        </span>

        <div className="flex items-center justify-end">
          <Link href={responseHref} title="Cevabı aç" aria-label="Cevabı aç"
            className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-skylab-300"
          >
            <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover/row:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ListItem({ form, linkedForm, viewHref, editHref, className = "" }) {
  if (!form) return null;

  const linkedId = linkedForm?.id;
  const linkedTitle = linkedForm?.title || "--";
  const hasLinked = Boolean(linkedId);
  const responsesHref = viewHref ? `${viewHref}/responses` : undefined;
  const canEdit = Number(form.userRole) >= 2;
  const responseCount = form.responseCount ?? 0;

  return (
    <div className={`group/row relative transition-colors hover:bg-white/3 ${className}`}>
      {viewHref && <Link href={viewHref} className="absolute inset-0 z-0" aria-label={form.title ?? "Form"} tabIndex={-1} />}
      <div className={`${FORM_GRID} px-3 py-2.5`}>

        <div className="flex justify-center">
          <StatusDot status={form.status} />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3">
            <FileText className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50">{form.title || "--"}</h3>
              <span className="md:hidden"><RoleBadge role={form.userRole} /></span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <span className="text-3xs tabular-nums text-neutral-500 sm:hidden">{responseCount} yanıt</span>
              <FeatureIcons form={form} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {hasLinked ? <LinkedFormChip id={linkedId} title={linkedTitle} /> : <span className="pl-1 text-2xs text-neutral-700">—</span>}
        </div>

        <span className="hidden text-center text-2xs tabular-nums text-neutral-500 sm:block">
          {formatUpdatedAt(form.updatedAt ?? form.createdAt)}
        </span>

        <div className="hidden text-center text-sm font-medium tabular-nums text-neutral-200 lg:block">
          {responseCount}
        </div>

        <div className="hidden justify-center lg:flex">
          <RoleBadge role={form.userRole} />
        </div>

        <div className="flex items-center justify-end gap-1">
          <div className="flex items-center gap-1 overflow-hidden transition-all duration-200 ease-out lg:max-w-0 lg:opacity-0 lg:group-hover/row:max-w-16 lg:group-hover/row:opacity-100">
            {responsesHref && (
              <Link href={responsesHref} title="Cevaplar" aria-label="Cevaplar"
                className="relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
              >
                <ChartColumn className="h-3 w-3" />
              </Link>
            )}
            {editHref && (canEdit ? (
              <Link href={editHref} title="Düzenle" aria-label="Düzenle"
                className="relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-skylab-400/30 bg-skylab-500/10 text-skylab-300 transition-colors hover:bg-skylab-400/20"
              >
                <PencilLine className="h-3 w-3" />
              </Link>
            ) : (
              <span title="Düzenleme yetkiniz yok" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/5 text-neutral-700">
                <PencilLine className="h-3 w-3" />
              </span>
            ))}
          </div>
          {viewHref && (
            <Link href={viewHref} title="Formu aç" aria-label="Formu aç"
              className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-skylab-300"
            >
              <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover/row:translate-x-0.5" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
