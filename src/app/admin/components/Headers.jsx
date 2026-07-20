"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChartColumn, Download, LayoutDashboard, LayoutList, PencilLine, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import ActionButton from "./utils/ActionButton";
import ResponsesFilterShell from "./utils/ResponsesFilterShell";
import FormsFilterShell, { DatabaseFilterShell } from "./utils/FormsFilterShell";

const fadeIn = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

const LABEL_STYLES = {
  1: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  2: "border-red-500/30 bg-red-500/10 text-red-200",
};

const emptySubscribe = () => () => {};

function HeaderSlotPortal({ children }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const target = isMounted ? document.getElementById("admin-header-slot") : null;
  return target ? createPortal(children, target) : null;
}

function Stat({ label, value }) {
  return (
    <div className="text-right">
      <p className="text-3xs font-medium uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-100 tabular-nums">{value ?? "--"}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = "Ara", compact = false }) {
  if (compact) {
    return (
      <div className="relative w-56 transition-[width] duration-200 focus-within:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
        <input type="search" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
          className="h-8 w-full rounded-md border border-white/10 bg-white/3 pl-8 pr-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-skylab-400/50 focus:bg-white/5 focus:outline-none transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-w-[180px] max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
      <input type="search" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-white/3 pl-8 pr-3 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-skylab-400/50 focus:bg-white/5 focus:outline-none transition-colors"
      />
    </div>
  );
}

function HeaderShell({ title, description, label, labelType = 1, actions, children }) {
  return (
    <motion.header {...fadeIn} className="space-y-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-neutral-100 truncate">{title}</h1>
            {label && (
              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-3xs uppercase tracking-[0.18em] ${LABEL_STYLES[labelType]}`}>
                {label}
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 text-2xs text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="h-px bg-white/10" />

      {children && (
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}

export default HeaderShell;

function FormsToolbar({ compact = false, searchValue = "", onSearchChange, sortValue = "desc", onSortChange, roleValue = "all", onRoleChange, allowAnonymous = null,
  onAllowAnonymousChange, allowMultiple = null, onAllowMultipleChange, hasLinkedForm = null, onHasLinkedFormChange, requiresManualReview = null, onRequiresManualReviewChange, onRefresh, onCreate
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const activeFilters = [sortValue !== "desc", roleValue !== "all", allowAnonymous !== null, allowMultiple !== null, hasLinkedForm !== null, requiresManualReview !== null].filter(Boolean).length;
  const filtersLabel = activeFilters ? `Filtreler (${activeFilters})` : "Filtreler";
  const buttonSize = compact ? "sm" : "md";

  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "w-full gap-2"}`}>
      <SearchInput compact={compact} value={searchValue} onChange={onSearchChange} placeholder="Form ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <div ref={filterButtonRef} className="relative">
          <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size={buttonSize} tone="header"
            variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
          />
          <FormsFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)} align={compact ? "right" : "center"}
            sortValue={sortValue} onSortChange={onSortChange} roleValue={roleValue} onRoleChange={onRoleChange}
            allowAnonymous={allowAnonymous} onAllowAnonymousChange={onAllowAnonymousChange}
            allowMultiple={allowMultiple} onAllowMultipleChange={onAllowMultipleChange}
            hasLinkedForm={hasLinkedForm} onHasLinkedFormChange={onHasLinkedFormChange}
            requiresManualReview={requiresManualReview} onRequiresManualReviewChange={onRequiresManualReviewChange}
          />
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh} size={buttonSize} tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={Plus} variant="primary" onClick={onCreate} size={buttonSize} tone="header" title="Yeni form ekle" aria-label="Yeni form ekle" />
      </div>
    </div>
  );
}

export function FormsHeader(toolbarProps) {
  return (
    <>
      <HeaderSlotPortal>
        <FormsToolbar compact {...toolbarProps} />
      </HeaderSlotPortal>
      <div className="md:hidden">
        <FormsToolbar {...toolbarProps} />
      </div>
    </>
  );
}

function ResponsesToolbar({ compact = false, searchValue = "", onSearchChange, sortValue = "desc", showArchived = false, onShowArchivedChange,
  onSortChange, statusValue = "all", onStatusChange, respondentValue = "all", onRespondentChange, onRefresh, onExport, exportLoading = false
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const activeFilters = [sortValue !== "desc", statusValue !== "all", respondentValue !== "all", showArchived !== false].filter(Boolean).length;
  const filtersLabel = activeFilters ? `Filtreler (${activeFilters})` : "Filtreler";
  const buttonSize = compact ? "sm" : "md";

  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "w-full gap-2"}`}>
      <SearchInput compact={compact} value={searchValue} onChange={onSearchChange} placeholder="Kullanıcı ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <div ref={filterButtonRef} className="relative">
          <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size={buttonSize} tone="header"
            variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
          />
          <ResponsesFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)} align={compact ? "right" : "center"}
            sortValue={sortValue} onSortChange={onSortChange} statusValue={statusValue} onStatusChange={onStatusChange}
            respondentValue={respondentValue} onRespondentChange={onRespondentChange} showArchived={showArchived} onShowArchivedChange={onShowArchivedChange}
          />
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh} size={buttonSize} tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={Download} variant="primary" onClick={onExport} disabled={exportLoading} size={buttonSize} tone="header" title="Excel İndir" aria-label="Excel İndir" />
      </div>
    </div>
  );
}

export function ResponsesHeader(toolbarProps) {
  return (
    <>
      <HeaderSlotPortal>
        <ResponsesToolbar compact {...toolbarProps} />
      </HeaderSlotPortal>
      <div className="md:hidden">
        <ResponsesToolbar {...toolbarProps} />
      </div>
    </>
  );
}

export function GroupsHeader({ searchValue = "", onSearchChange, onRefresh, onCreate, stats = { count: 0 } }) {
  return (
    <HeaderShell title="Bileşen Grupları" description="Bileşen grupları oluşturun ve forma hızlıca ekleyin.">
      <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Grup ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={Plus} variant="primary" onClick={onCreate} size="md" tone="header" title="Yeni grup ekle" aria-label="Yeni grup ekle" />
      </div>
      <div className="ml-auto shrink-0">
        <Stat label="Toplam Grup" value={stats.count} />
      </div>
    </HeaderShell>
  );
}

export function DatabaseHeader({ searchValue = "", onSearchChange, sortValue = "desc", onSortChange, allowAnonymous = null, onAllowAnonymousChange,
  allowMultiple = null, onAllowMultipleChange, hasLinkedForm = null, onHasLinkedFormChange, requiresManualReview = null, onRequiresManualReviewChange,
  onRefresh, stats = { count: 0 }
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const activeFilters = [sortValue !== "desc", allowAnonymous !== null, allowMultiple !== null, hasLinkedForm !== null, requiresManualReview !== null].filter(Boolean).length;
  const filtersLabel = activeFilters ? `Filtreler (${activeFilters})` : "Filtreler";

  return (
    <HeaderShell title="Veritabanı" description="Sistemdeki tüm formları görüntüle.">
      <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Form ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <div ref={filterButtonRef} className="relative">
          <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size="md" tone="header"
            variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
          />
          <DatabaseFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)}
            sortValue={sortValue} onSortChange={onSortChange}
            allowAnonymous={allowAnonymous} onAllowAnonymousChange={onAllowAnonymousChange}
            allowMultiple={allowMultiple} onAllowMultipleChange={onAllowMultipleChange}
            hasLinkedForm={hasLinkedForm} onHasLinkedFormChange={onHasLinkedFormChange}
            requiresManualReview={requiresManualReview} onRequiresManualReviewChange={onRequiresManualReviewChange}
          />
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
      </div>
      <div className="ml-auto shrink-0">
        <Stat label="Toplam Form" value={stats.count} />
      </div>
    </HeaderShell>
  );
}

function OverviewToolbar({ compact = false, statusLabel, statusType = 1, onEdit, onViewResponses, onAnalytics, onRefresh, userRole }) {
  const size = compact ? "sm" : "md";
  const canView = Number(userRole) >= 1;
  const canEdit = Number(userRole) >= 2;

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "w-full justify-between"}`}>
      {statusLabel && (
        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-3xs uppercase tracking-[0.18em] ${LABEL_STYLES[statusType]}`}>
          {statusLabel}
        </span>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <ActionButton icon={RefreshCw} onClick={onRefresh} size={size} tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={ChartColumn} onClick={onAnalytics} disabled={!canView} className={!canView ? "opacity-30 pointer-events-none" : ""} size={size} tone="header" title="Analitik" aria-label="Analitik" />
        <ActionButton icon={LayoutList} onClick={onViewResponses} disabled={!canView} className={!canView ? "opacity-30 pointer-events-none" : ""} size={size} tone="header" title="Cevaplar" aria-label="Cevaplar" />
        <ActionButton icon={PencilLine} variant={canEdit ? "primary" : "ghost"} disabled={!canEdit} className={!canEdit ? "opacity-30 pointer-events-none" : ""} onClick={onEdit} size={size} tone="header" title="Düzenle" aria-label="Düzenle" />
      </div>
    </div>
  );
}

export function OverviewHeader({ formStatus, onEdit, onViewResponses, onAnalytics, onRefresh, userRole }) {
  const isActive = formStatus === 2;
  const toolbarProps = { statusLabel: isActive ? "Aktif" : "Pasif", statusType: isActive ? 1 : 2, onEdit, onViewResponses, onAnalytics, onRefresh, userRole };

  return (
    <>
      <HeaderSlotPortal>
        <OverviewToolbar compact {...toolbarProps} />
      </HeaderSlotPortal>
      <div className="md:hidden">
        <OverviewToolbar {...toolbarProps} />
      </div>
    </>
  );
}

function AnalyticsToolbar({ compact = false, onOverview, onViewResponses, onEdit, onRefresh, userRole }) {
  const size = compact ? "sm" : "md";
  const canView = Number(userRole) >= 1;
  const canEdit = Number(userRole) >= 2;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "w-full justify-end"}`}>
      <ActionButton icon={LayoutDashboard} onClick={onOverview} size={size} tone="header" title="Genel Bakış" aria-label="Genel Bakış" />
      <ActionButton icon={LayoutList} onClick={onViewResponses} disabled={!canView} className={!canView ? "opacity-30 pointer-events-none" : ""} size={size} tone="header" title="Cevaplar" aria-label="Cevaplar" />
      <ActionButton icon={PencilLine} disabled={!canEdit} className={!canEdit ? "opacity-30 pointer-events-none" : ""} onClick={onEdit} size={size} tone="header" title="Düzenle" aria-label="Düzenle" />
      <ActionButton icon={RefreshCw} onClick={onRefresh} size={size} tone="header" title="Yenile" aria-label="Yenile" />
    </div>
  );
}

export function AnalyticsHeader(props) {
  return (
    <>
      <HeaderSlotPortal>
        <AnalyticsToolbar compact {...props} />
      </HeaderSlotPortal>
      <div className="md:hidden">
        <AnalyticsToolbar {...props} />
      </div>
    </>
  );
}
