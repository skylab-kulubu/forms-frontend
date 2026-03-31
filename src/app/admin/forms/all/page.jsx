"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChartColumn, ClipboardCheck, Repeat2, UserX, User2, ArrowUpRight, Clock, Pencil } from "lucide-react";
import { DatabaseHeader } from "../../components/Headers";
import { ListItemSkeleton } from "../../components/ListItem";
import Pagination from "../../components/utils/Pagination";
import { useAllFormsQuery } from "@/lib/hooks/useFormAdmin";
import StateCard from "@/app/components/StateCard";
import { FileSearchCorner, FileXCorner } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

function normalizeName(name) {
  if (!name) return null;
  return name.trim().toLocaleLowerCase("tr-TR").split(/\s+/)
    .map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR")))
    .join(" ");
}

function AllFormItem({ form }) {
  const createdBy = form.createdBy ?? null;
  const ownerName = normalizeName(createdBy?.fullName ?? null);
  const statusActive = form.status === 2;

  return (
    <div className="group/row relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/3">
      <Link href={`/admin/forms/${form.id}`} className="absolute inset-0 z-0" tabIndex={-1} />

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-neutral-100 truncate max-w-xs">{form.title || "--"}</p>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em] ${statusActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
            {statusActive ? "Aktif" : "Pasif"}
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-neutral-600 font-mono">{form.id}</span>
          <div className="flex items-center gap-1">
            <User2 size={9} className="text-neutral-600 shrink-0" />
            <span className="text-[10px] text-neutral-500">{ownerName ?? "--"}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600" title="Oluşturulma">
            <Clock size={9} />
            {formatDate(form.createdAt)}
          </span>
          {form.updatedAt && form.updatedAt !== form.createdAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600" title="Güncellenme">
              <Pencil size={9} />
              {formatDate(form.updatedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 relative z-10 shrink-0">
        <div className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-neutral-500">
          <ChartColumn size={11} />
          {form.responseCount ?? 0}
        </div>
        <div title="Çoklu cevap" className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${form.allowMultipleResponses ? "text-skylab-500/80" : "text-neutral-600/40"}`}>
          <Repeat2 size={13} />
        </div>
        <div title="Anonim cevap" className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${form.allowAnonymousResponses ? "text-skylab-500/80" : "text-neutral-600/40"}`}>
          <UserX size={13} />
        </div>
        <div title="Manuel inceleme" className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${form.requiresManualReview ? "text-skylab-500/80" : "text-neutral-600/40"}`}>
          <ClipboardCheck size={13} />
        </div>
        <Link href={`/admin/forms/${form.id}`} className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-200 transition-colors">
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function AllFormsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("desc");
  const [allowAnonymous, setAllowAnonymous] = useState(null);
  const [allowMultiple, setAllowMultiple] = useState(null);
  const [hasLinkedForm, setHasLinkedForm] = useState(null);
  const [requiresManualReview, setRequiresManualReview] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 500);
    return () => clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => { setPage(1); }, [debouncedSearch, sortValue, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview]);

  const sortDirection = sortValue === "asc" ? "ascending" : "descending";

  const { data, isLoading, error, refetch } = useAllFormsQuery({ page, search: debouncedSearch || undefined, sortDirection, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview });

  const meta = data?.data ?? {};
  const forms = Array.isArray(meta.items) ? meta.items : Array.isArray(data) ? data : [];
  const totalCount = meta.totalCount ?? forms.length;
  const hasError = Boolean(error);
  const contentKey = `${sortValue}-${allowAnonymous}-${allowMultiple}-${hasLinkedForm}-${requiresManualReview}-${debouncedSearch}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-6">
      <DatabaseHeader searchValue={searchValue} onSearchChange={setSearchValue} sortValue={sortValue} onSortChange={setSortValue}
        allowAnonymous={allowAnonymous} onAllowAnonymousChange={setAllowAnonymous} allowMultiple={allowMultiple} onAllowMultipleChange={setAllowMultiple}
        hasLinkedForm={hasLinkedForm} onHasLinkedFormChange={setHasLinkedForm} requiresManualReview={requiresManualReview} onRequiresManualReviewChange={setRequiresManualReview}
        onRefresh={() => refetch()} stats={{ count: isLoading ? "--" : totalCount }}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <ListItemSkeleton count={5} />
          ) : hasError ? (
            <StateCard title="Formlar yüklenemedi" Icon={FileXCorner} description="Form verileri yüklenirken hata oluştu." />
          ) : forms.length === 0 ? (
            <StateCard title="Form bulunamadı" Icon={FileSearchCorner} description={debouncedSearch ? "Arama kriterine uyan form bulunamadı." : "Sistemde kayıtlı form bulunmuyor."} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar">
                <div>
                  {forms.map((form, i) => (
                    <div key={form.id}>
                      {i > 0 && <div className="mx-4 h-px bg-white/6" />}
                      <AllFormItem form={form} />
                    </div>
                  ))}
                </div>
              </div>
              <Pagination current={meta.page ?? page} totalPages={meta.totalPages ?? 1} totalCount={totalCount} pageSize={meta.pageSize ?? forms.length} entriesLength={forms.length} onPageChange={setPage}/>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}