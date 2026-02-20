"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { List, PencilLine, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import ActionButton from "./utils/ActionButton";
import ResponsesFilterShell from "./utils/ResponsesFilterShell";
import FormsFilterShell from "./utils/FormsFilterShell";

const fadeIn = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const LABEL_STYLES = {
  1: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  2: "border-red-500/30 bg-red-500/10 text-red-200",
};

function HeaderShell({ title, description, label, labelType = 1, actions, children }) {
  return (
    <motion.div {...fadeIn} className="pb-2 border-b border-white/10">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          {label ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-neutral-200">
                  {title}
                </h1>
                <span className={`px-2 py-0.5 text-xs border rounded-md ${LABEL_STYLES[labelType]}`}>
                  {label}
                </span>
              </div>
              {description && (<p className="text-xs text-neutral-500">{description}</p>)}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-xl font-semibold text-neutral-200">
                {title}
              </h1>
              {description && (<p className="text-xs text-neutral-500">{description}</p>)}
            </div>
          )}
        </div>
        {actions && (<div className="flex items-center shrink-0"> {actions} </div>)}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </motion.div>
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
      <div className="flex flex-wrap items-center gap-3 w-full md:flex-nowrap">
        <div className="relative flex-1 min-w-[220px] md:min-w-[280px] max-w-md">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input type="search" value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Form ara"
            className="h-9 w-full border rounded-lg border-white/10 bg-transparent pl-7 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
          <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header"
            title="Yenile" aria-label="Yenile"
          />
          <ActionButton icon={Plus} variant="primary" onClick={onCreate} size="md" tone="header"
            title="Yeni form ekle" aria-label="Yeni form ekle"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 -mt-2.5 text-center shrink-0 md:ml-auto">
          <div className="text-[12px] text-neutral-500">
            <div className="px-3 py-2 text-[11px] text-neutral-400">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Erişilebilir Form</p>
              <p className="text-sm font-semibold text-neutral-100">{stats.count ?? "--"}</p>
            </div>
          </div>
        </div>
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
      <div className="flex flex-wrap items-center gap-3 w-full md:flex-nowrap">
        <div className="relative flex-1 min-w-[220px] md:min-w-[280px] max-w-md">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input type="search" value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Kullanıcı ara"
            className="h-9 w-full border rounded-lg border-white/10 bg-transparent pl-7 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div ref={filterButtonRef} className="relative">
            <ActionButton icon={SlidersHorizontal} onClick={() => setFiltersOpen((prev) => !prev)} size="md" tone="header"
              variant={filtersOpen ? "primary" : "ghost"} title={filtersLabel} aria-label={filtersLabel} aria-expanded={filtersOpen}
            />
            <ResponsesFilterShell open={filtersOpen} anchorRef={filterButtonRef} onClose={() => setFiltersOpen(false)}
              sortValue={sortValue} onSortChange={onSortChange} statusValue={statusValue} onStatusChange={onStatusChange}
              respondentValue={respondentValue} onRespondentChange={onRespondentChange} showArchived={showArchived} onShowArchivedChange={onShowArchivedChange}
            />
          </div>
          <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header"
            title="Yenile" aria-label="Yenile"
          />
          <ActionButton icon={PencilLine} variant="primary" onClick={onEdit} size="md" tone="header"
            title="Düzenle" aria-label="Düzenle"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-center -mt-2.5 shrink-0 md:ml-auto">
          <div className="px-3 py-2 text-[11px] text-neutral-400">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Ortalama Süre</p>
            <p className="text-sm font-semibold text-neutral-100">{stats.averageTimeSpent?? "--"}</p>
          </div>
          <div className="px-3 py-2 text-[11px] text-neutral-400">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Cevap Sayısı</p>
            <p className="text-sm font-semibold text-neutral-100">{stats.responseCount ?? 0}</p>
          </div>
          <div className="px-3 py-2 text-[11px] text-neutral-400">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Bekleyen</p>
            <p className="text-sm font-semibold text-neutral-100">{stats.pendingCount ?? 0}</p>
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}

export function OverviewHeader({ formTitle, formId, formStatus, onEdit, onViewResponses, onRefresh }) {
  const isActive = formStatus === 1;
  const statusLabel = isActive ? "Aktif" : "Pasif";
  const statusStyle = isActive ? 1 : 2;

  return (
    <HeaderShell title={formTitle || "--"} label={statusLabel} labelType={statusStyle} description={`ID: ${formId || "--"}`}
      actions={
        <div className="flex items-center gap-2 mt-3">
          <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile" />
          <ActionButton icon={List} onClick={onViewResponses} size="md" tone="header" title="Cevaplar" aria-label="Cevaplar" />
          <ActionButton icon={PencilLine} variant="primary" onClick={onEdit} size="md" tone="header" title="Düzenle" aria-label="Düzenle" />
        </div>
      }>
    </HeaderShell>
  );
}