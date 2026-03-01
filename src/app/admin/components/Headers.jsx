"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { List, PencilLine, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import ActionButton from "./utils/ActionButton";
import ResponsesFilterShell from "./utils/ResponsesFilterShell";
import FormsFilterShell from "./utils/FormsFilterShell";

const fadeIn = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

const LABEL_STYLES = {
  1: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  2: "border-red-500/30 bg-red-500/10 text-red-200",
};

function Stat({ label, value }) {
  return (
    <div className="text-right">
      <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-100 tabular-nums">{value ?? "--"}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = "Ara" }) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
      <input type="search" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-white/8 bg-white/3 pl-8 pr-3 text-[12px] text-neutral-100 placeholder:text-neutral-600 focus:border-white/15 focus:bg-white/5 focus:outline-none transition-colors"
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
              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${LABEL_STYLES[labelType]}`}>
                {label}
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 text-[11px] text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="h-px bg-white/6" />

      {children && (
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          {children}
        </div>
      )}
    </motion.header>
  );
}

export default HeaderShell;

export function FormsHeader({ searchValue = "", onSearchChange, sortValue = "desc", onSortChange, roleValue = "all", onRoleChange, allowAnonymous = null,
  onAllowAnonymousChange, allowMultiple = null, onAllowMultipleChange, hasLinkedForm = null, onHasLinkedFormChange, requiresManualReview = null, onRequiresManualReviewChange, onRefresh, onCreate, stats = { count: 0 }
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const activeFilters = [sortValue !== "desc", roleValue !== "all", allowAnonymous !== null, allowMultiple !== null, hasLinkedForm !== null, requiresManualReview !== null].filter(Boolean).length;
  const filtersLabel = activeFilters ? `Filtreler (${activeFilters})` : "Filtreler";

  return (
    <HeaderShell title="Formlar" description="Formları ara, sırala ve hızlıca cevaplara göz at.">
      <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Form ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <div ref={filterButtonRef} className="relative">
          <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size="md" tone="header"
            variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
          />
          <FormsFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)}
            sortValue={sortValue} onSortChange={onSortChange} roleValue={roleValue} onRoleChange={onRoleChange}
            allowAnonymous={allowAnonymous} onAllowAnonymousChange={onAllowAnonymousChange}
            allowMultiple={allowMultiple} onAllowMultipleChange={onAllowMultipleChange}
            hasLinkedForm={hasLinkedForm} onHasLinkedFormChange={onHasLinkedFormChange}
            requiresManualReview={requiresManualReview} onRequiresManualReviewChange={onRequiresManualReviewChange}
          />
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={Plus} variant="primary" onClick={onCreate} size="md" tone="header" title="Yeni form ekle" aria-label="Yeni form ekle" />
      </div>
      <div className="ml-auto shrink-0">
        <Stat label="Erişilebilir Form" value={stats.count} />
      </div>
    </HeaderShell>
  );
}

export function ResponsesHeader({ formTitle = "--", formId = "--", searchValue = "", onSearchChange, sortValue = "desc", showArchived = false, onShowArchivedChange,
  onSortChange, statusValue = "all", onStatusChange, respondentValue = "all", onRespondentChange, onRefresh, onEdit, stats = { averageTimeSpent: "--", responseCount: 0, pendingCount: 0 },
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const activeFilters = [sortValue !== "desc", statusValue !== "all", respondentValue !== "all", showArchived !== false].filter(Boolean).length;
  const filtersLabel = activeFilters ? `Filtreler (${activeFilters})` : "Filtreler";

  return (
    <HeaderShell title={formTitle || "--"} description={`ID: ${formId || "--"}`}>
      <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Kullanıcı ara" />
      <div className="flex items-center gap-1.5 shrink-0">
        <div ref={filterButtonRef} className="relative">
          <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size="md" tone="header"
            variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
          />
          <ResponsesFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)}
            sortValue={sortValue} onSortChange={onSortChange} statusValue={statusValue} onStatusChange={onStatusChange}
            respondentValue={respondentValue} onRespondentChange={onRespondentChange} showArchived={showArchived} onShowArchivedChange={onShowArchivedChange}
          />
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
        <ActionButton icon={PencilLine} variant="primary" onClick={onEdit} size="md" tone="header" title="Düzenle" aria-label="Düzenle" />
      </div>
      <div className="flex items-center gap-5 ml-auto shrink-0">
        <Stat label="Ort. Süre" value={stats.averageTimeSpent} />
        <Stat label="Cevap" value={stats.responseCount} />
        <Stat label="Bekleyen" value={stats.pendingCount} />
      </div>
    </HeaderShell>
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

export function OverviewHeader({ formTitle, formId, formStatus, onEdit, onViewResponses, onRefresh }) {
  const isActive = formStatus === 2;
  const statusLabel = isActive ? "Aktif" : "Pasif";
  const statusStyle = isActive ? 1 : 2;

  return (
    <HeaderShell
      title={formTitle || "--"} label={statusLabel} labelType={statusStyle} description={`ID: ${formId || "--"}`}
      actions={
        <div className="flex items-center gap-1.5">
          <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
          <ActionButton icon={List} onClick={onViewResponses} size="md" tone="header" title="Cevaplar" aria-label="Cevaplar" />
          <ActionButton icon={PencilLine} variant="primary" onClick={onEdit} size="md" tone="header" title="Düzenle" aria-label="Düzenle" />
        </div>
      }
    />
  );
}
