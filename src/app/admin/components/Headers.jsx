"use client";

import { motion } from "framer-motion";
import { Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import ActionButton from "./utils/ActionButton";

const fadeIn = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

function HeaderShell({ title, description, children }) {
  return (
    <motion.div {...fadeIn} className="pb-2 border-b border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-neutral-200">
          {title}
        </h1>
        {description && (<p className="text-xs mt-2 text-neutral-500">{description}</p>)}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </motion.div>
  );
}

export function FormsHeader({ searchValue = "", onSearchChange, sortValue = "recent", onSortChange, onRefresh, onCreate, stats = { count: 0 } }) {
  const sortOptions = [
    { value: "recent", label: "Son düzenlenen" },
    { value: "responses", label: "En çok yanıt" },
    { value: "alphabetic", label: "Alfabetik" },
  ];

  const currentSort = sortOptions.find((item) => item.value === sortValue) ?? sortOptions[0];

  const cycleSort = () => {
    const index = sortOptions.findIndex((item) => item.value === currentSort.value);
    const next = sortOptions[(index + 1) % sortOptions.length];
    onSortChange?.(next.value);
  };

  return (
    <HeaderShell title="Formlar" description="Formlarını ara, sırala ve hızlıca cevaplara göz at">
      <div className="flex flex-wrap items-center gap-3 w-full md:flex-nowrap">
        <div className="relative flex-1 min-w-[220px] md:min-w-[280px] max-w-md">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input type="search" value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Form ara"
            className="h-9 w-full border rounded-lg border-white/10 bg-transparent pl-7 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ActionButton icon={SlidersHorizontal} onClick={cycleSort} size="md" tone="header"
            title={`Sırala: ${currentSort.label}`} aria-label={`Sırala: ${currentSort.label}`}
          />
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
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Erişilebilen form</p>
              <p className="text-sm font-semibold text-neutral-100">{stats.count ?? "--"}</p>
            </div>
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}

export function ResponsesHeader({ formTitle = "--", formId = "--", searchValue = "", onSearchChange, filterValue = "all", onFilterChange, onRefresh, stats = { averageTime: "--", responseCount: 0, pendingCount: 0 } }) {
  const filterOptions = [
    { value: "all", label: "Tüm Cevaplar" },
    { value: "none", label: "Durum Yok" },
    { value: "pending", label: "Beklemede" },
    { value: "approved", label: "Onaylandı" },
    { value: "rejected", label: "Reddedildi" },
  ];

  const currentFilter = filterOptions.find((item) => item.value === filterValue) ?? filterOptions[0];

  const cycleFilter = () => {
    const index = filterOptions.findIndex((item) => item.value === currentFilter.value);
    const next = filterOptions[(index + 1) % filterOptions.length];
    onFilterChange?.(next.value);
  };

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
          <ActionButton icon={SlidersHorizontal} onClick={cycleFilter} size="md" tone="header"
            title={`Filtre: ${currentFilter.label}`} aria-label={`Filtre: ${currentFilter.label}`}
          />
          <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header"
            title="Yenile" aria-label="Yenile"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-center -mt-2.5 shrink-0 md:ml-auto">
          <div className="px-3 py-2 text-[11px] text-neutral-400">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Ortalama Süre</p>
            <p className="text-sm font-semibold text-neutral-100">{stats.averageTime ?? "--"}</p>
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
