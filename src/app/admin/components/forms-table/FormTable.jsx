"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FilePlus, FileSearchCorner, FileXCorner } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { useWorkflowsQuery } from "@/lib/hooks/useWorkflowAdmin";
import { FormsHeader } from "../Headers";
import Pagination from "../utils/Pagination";
import { TableHead, TableRow, TableSkeleton } from "./FormTableRow";
import { PAGE_SIZE, STATE_TABS, TABLE_COLUMNS, buildRows, defaultHidden, gridVars, matchesTab, tabCounts } from "./table-data";
import { useAllForms } from "./useAllForms";

const HIDDEN_KEY = "skyforms:forms-table-hidden";

function subscribeHidden(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(HIDDEN_KEY, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(HIDDEN_KEY, onChange);
  };
}

function readStoredHidden() {
  try {
    return window.localStorage.getItem(HIDDEN_KEY);
  } catch {
    return null;
  }
}

function useHiddenColumns() {
  const stored = useSyncExternalStore(subscribeHidden, readStoredHidden, () => null);

  const hidden = useMemo(() => {
    try {
      const saved = JSON.parse(stored);
      if (Array.isArray(saved)) return new Set(saved);
    } catch {}
    return defaultHidden();
  }, [stored]);

  const save = (next) => {
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
    } catch {}
    window.dispatchEvent(new Event(HIDDEN_KEY));
  };

  return [hidden, save];
}

export default function FormTable() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("desc");
  const [sortField, setSortField] = useState("updatedAt");
  const [roleValue, setRoleValue] = useState("all");
  const [allowAnonymous, setAllowAnonymous] = useState(null);
  const [allowMultiple, setAllowMultiple] = useState(null);
  const [requiresManualReview, setRequiresManualReview] = useState(null);
  const [page, setPage] = useState(1);
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [tab, setTab] = useState("all");
  const [hidden, saveHidden] = useHiddenColumns();

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortValue((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortValue("desc");
    }
  };

  const toggleOpen = (key) => setOpenKeys((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const toggleColumn = (id) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id); else next.add(id);
    saveHidden(next);
  };

  const roleParam = { viewer: 1, editor: 2, owner: 3 }[roleValue] ?? null;
  const { forms, isLoading, error, refetch } = useAllForms({ search: debouncedSearch || undefined, role: roleParam, allowAnonymous, allowMultiple, requiresManualReview });
  const { data: flowsData } = useWorkflowsQuery({ pageSize: 100 });

  const flows = useMemo(() => {
    const payload = flowsData?.data ?? flowsData;
    return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
  }, [flowsData]);

  const { rows, peak } = useMemo(() => buildRows({ forms, flows, flat: Boolean(debouncedSearch), sortField, sortValue }), [forms, flows, debouncedSearch, sortField, sortValue]);

  const counts = useMemo(() => tabCounts(rows), [rows]);
  const totals = useMemo(() => ({
    pending: rows.reduce((sum, row) => sum + row.pending, 0),
    week: forms.reduce((sum, form) => sum + (form.last7Days ?? []).reduce((days, value) => days + value, 0), 0),
  }), [rows, forms]);
  const shown = useMemo(() => new Set(TABLE_COLUMNS.filter((column) => !hidden.has(column.id)).map((column) => column.id)), [hidden]);
  const inTab = useMemo(() => rows.filter((row) => matchesTab(row, tab)), [rows, tab]);

  const totalPages = Math.max(1, Math.ceil(inTab.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = inTab.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtering = Boolean(debouncedSearch) || roleParam !== null || allowAnonymous !== null || allowMultiple !== null || requiresManualReview !== null;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <FormsHeader searchValue={searchValue} onSearchChange={setSearchValue} sortValue={sortValue} onSortChange={(direction) => { setSortField("updatedAt"); setSortValue(direction); }}
        roleValue={roleValue} onRoleChange={setRoleValue} allowAnonymous={allowAnonymous} onAllowAnonymousChange={setAllowAnonymous} allowMultiple={allowMultiple} onAllowMultipleChange={setAllowMultiple}
        requiresManualReview={requiresManualReview} onRequiresManualReviewChange={setRequiresManualReview} onRefresh={refetch} onCreate={() => router.push("/admin/forms/new-form")}
        stateOptions={STATE_TABS} stateCounts={counts} stateValue={tab} onStateChange={(next) => { setTab(next); setPage(1); }}
      />

      <motion.div className="@container flex min-h-0 flex-1 flex-col" style={gridVars(hidden)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar">
          <TableHead sortField={sortField} sortDirection={sortValue} onSort={handleSort} shown={shown} hidden={hidden} onToggleColumn={toggleColumn} onResetColumns={() => saveHidden(defaultHidden())} />
          {isLoading ? (
            <TableSkeleton />
          ) : error ? (
            <StateCard title="Formlar yüklenemedi" Icon={FileXCorner} description="Form verileri yüklenirken hata oluştu." />
          ) : rows.length === 0 && filtering ? (
            <StateCard title="Form bulunamadı" Icon={FileSearchCorner} description={debouncedSearch ? "Aranılan kelimede form bulunamadı." : "Verilen filtrelere uygun form bulunamadı."} />
          ) : rows.length > 0 && inTab.length === 0 ? (
            <StateCard title="Bu durumda form yok" Icon={FileSearchCorner} description="Filtreden başka bir durum seçebilirsin." />
          ) : rows.length === 0 ? (
            <StateCard title="Henüz formun yok" Icon={FilePlus} description="Oluşturduğun formlar ve eklendiğin formlar burada görünür.">
              <Link href="/admin/forms/new-form" className="inline-flex h-9 items-center rounded-md border border-skylab-400/30 bg-skylab-500/10 px-3 text-xs font-medium text-skylab-300 transition-colors hover:bg-skylab-400/20">
                İlk formunu oluştur
              </Link>
            </StateCard>
          ) : (
            <div className="divide-y divide-white/5">
              {visible.map((row) => (
                <TableRow key={row.key} row={row} peak={peak} open={openKeys.has(row.key)} onToggle={() => toggleOpen(row.key)} shown={shown} />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && inTab.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-white/10">
            <p className="pt-3 text-2xs text-neutral-500">
              <span className="font-semibold tabular-nums text-neutral-200">{tab === "all" ? forms.length : inTab.length}</span> form gösteriliyor
              {totals.pending ? <> · <span className="tabular-nums text-neutral-300">{totals.pending}</span> onay bekliyor</> : null}
              {" "}· son 7 günde <span className="tabular-nums text-neutral-300">{totals.week}</span> cevap
            </p>
            <Pagination current={current} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
