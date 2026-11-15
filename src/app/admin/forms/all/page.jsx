"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { FileSearchCorner, FileXCorner, X } from "lucide-react";
import { ActiveFilters, Button } from "@skylab-kulubu/skylcn-ui";
import StateCard from "@/app/components/StateCard";
import { DatabaseHeader } from "../../components/Headers";
import Pagination from "../../components/utils/Pagination";
import { useAllFormsQuery, useRestoreFormMutation } from "@/lib/hooks/useFormAdmin";
import { formatPersonName } from "../../components/form-responses/response-data";
import { FLAG_KEYS, filterCount, hrefOf, queryOf, readParams } from "../../components/form-database/database-params";
import { DatabaseListHeader, DatabaseRow, DatabaseSkeleton } from "../../components/form-database/DatabaseTable";

const STATUS_LABEL = { open: "Açık formlar", closed: "Kapalı formlar", deleted: "Silinen formlar" };
const CLEARED = { status: "all", owner: "all", anon: null, multi: null, review: null };

function currentState() {
  return readParams(new URLSearchParams(window.location.search));
}

function FooterLink({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="rounded tabular-nums underline decoration-border-strong underline-offset-2 outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
      {children}
    </button>
  );
}

function DatabasePage() {
  const searchParams = useSearchParams();
  const state = readParams(searchParams);
  const [search, setSearch] = useState(state.q);

  const update = useCallback((patch, { resetPage = true } = {}) => {
    const next = { ...currentState(), ...(resetPage ? { page: 1, open: null } : {}), ...patch };
    window.history.replaceState(null, "", hrefOf(window.location.pathname, next));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      const value = search.trim();
      if (value !== currentState().q) update({ q: value });
    }, 400);
    return () => clearTimeout(handle);
  }, [search, update]);

  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = useAllFormsQuery({ ...queryOf(state), placeholderData: keepPreviousData });
  const restore = useRestoreFormMutation();

  const meta = data?.data ?? {};
  const forms = Array.isArray(meta.items) ? meta.items : [];
  const summary = meta.summary ?? null;
  const owners = Array.isArray(meta.owners) ? meta.owners : [];
  const totalCount = meta.totalCount ?? forms.length;
  const filters = filterCount(state);
  const narrowed = filters > 0 || Boolean(state.q);

  const clearFilters = () => update(CLEARED);
  const clearAll = () => {
    setSearch("");
    update({ ...CLEARED, q: "" });
  };

  const handleSort = (field) => {
    if (field === state.sort) update({ dir: state.dir === "asc" ? "desc" : "asc" });
    else update({ sort: field, dir: "desc" });
  };

  const ownerLabel = state.owner === "orphaned"
    ? "Sahipsiz"
    : formatPersonName(owners.find((owner) => owner.id === state.owner)?.fullName) || "Seçili sahip";
  const chips = [
    state.status !== "all" && { key: "status", label: STATUS_LABEL[state.status], onRemove: () => update({ status: "all" }) },
    state.owner !== "all" && { key: "owner", label: ownerLabel, onRemove: () => update({ owner: "all" }) },
    ...FLAG_KEYS.map(([key, label]) => state[key] !== null && { key, label: `${label} ${state[key] ? "açık" : "kapalı"}`, onRemove: () => update({ [key]: null }) }),
  ].filter(Boolean);

  const restoring = (id) => restore.isPending && restore.variables === id;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-4 overflow-hidden p-4 lg:p-6">
      <DatabaseHeader searchValue={search} onSearchChange={setSearch} state={state} onChange={(patch) => update(patch)} onClear={clearFilters}
        summary={summary} owners={owners} onRefresh={() => refetch()}
      />

      {chips.length || state.status === "deleted" ? (
        <div className="flex flex-col gap-1.5">
          <ActiveFilters filters={chips} onClear={clearFilters} />
          {state.status === "deleted" ? (
            <p className="text-2xs text-subtle-foreground">Geri yüklenen form kapalı olarak döner; cevapları ve ayarları silinmeden durur.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar transition-opacity ${isFetching && isPlaceholderData ? "opacity-60" : ""}`}>
          <DatabaseListHeader sort={state.sort} dir={state.dir} onSort={handleSort} />
          {isLoading ? (
            <DatabaseSkeleton count={8} />
          ) : error ? (
            <StateCard title="Formlar yüklenemedi" Icon={FileXCorner} description="Form listesi alınırken bir hata oluştu." />
          ) : forms.length === 0 ? (
            <StateCard Icon={FileSearchCorner}
              title={narrowed ? (filters ? "Filtrelere uyan form yok" : "Aramaya uyan form yok") : state.status === "deleted" ? "Silinmiş form yok" : "Sistemde kayıtlı form yok"}
              description={narrowed ? "Aramayı ya da filtreleri değiştirip yeniden deneyin." : null}
            >
              {narrowed ? (
                <Button variant="outline" onClick={clearAll}>
                  <X aria-hidden="true" />
                  {filters ? "Filtreleri temizle" : "Aramayı temizle"}
                </Button>
              ) : null}
            </StateCard>
          ) : (
            <div className="divide-y divide-border-subtle">
              {forms.map((form) => (
                <DatabaseRow key={form.id} form={form} open={state.open === form.id}
                  onToggle={() => update({ open: state.open === form.id ? null : form.id }, { resetPage: false })}
                  onRestore={() => restore.mutate(form.id)} restoring={restoring(form.id)}
                />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && forms.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border">
            <p className="pt-3 text-2xs text-subtle-foreground">
              <span className="font-semibold tabular-nums text-foreground">{totalCount}</span> {state.status === "deleted" ? "silinmiş form" : "form"}
              {summary?.orphaned > 0 && state.owner !== "orphaned" && state.status !== "deleted" ? <> · <FooterLink onClick={() => update({ owner: "orphaned" })}>{summary.orphaned} sahipsiz</FooterLink></> : null}
              {summary?.deleted > 0 && state.status !== "deleted" ? <> · <FooterLink onClick={() => update({ status: "deleted" })}>{summary.deleted} silinmiş</FooterLink></> : null}
            </p>
            <Pagination current={meta.page ?? state.page} totalPages={meta.totalPages ?? 1} onPageChange={(page) => update({ page, open: null }, { resetPage: false })} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AllFormsPage() {
  return (
    <Suspense fallback={null}>
      <DatabasePage />
    </Suspense>
  );
}
