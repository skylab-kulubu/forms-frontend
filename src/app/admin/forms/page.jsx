"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormsHeader } from "../components/Headers";
import ListItem, { ListItemSkeleton } from "../components/ListItem";
import Pagination from "../components/utils/Pagination";
import { useUserFormsQuery } from "@/lib/hooks/useFormAdmin";
import StateCard from "@/app/components/StateCard";
import { FileSearchCorner, FileXCorner } from "lucide-react";

export default function FormsPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("desc");
  const [roleValue, setRoleValue] = useState("all");
  const [allowAnonymous, setAllowAnonymous] = useState(null);
  const [allowMultiple, setAllowMultiple] = useState(null);
  const [hasLinkedForm, setHasLinkedForm] = useState(null);
  const [requiresManualReview, setRequiresManualReview] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 500);
    return () => clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [debouncedSearch, sortValue, roleValue, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview]);

  const roleParam = useMemo(() => {
    if (roleValue === "viewer") return 1;
    if (roleValue === "editor") return 2;
    if (roleValue === "owner") return 3;
    return null;
  }, [roleValue]);

  const sortDirection = sortValue === "asc" ? "ascending" : "descending";

  const { data: formsData, isLoading, error, refetch } = useUserFormsQuery({ page, search: debouncedSearch || undefined, role: roleParam, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview, sortDirection });

  const formsMeta = formsData?.data ?? {};
  const forms = Array.isArray(formsMeta.items) ? formsMeta.items : Array.isArray(formsData) ? formsData : [];

  const formsById = useMemo(() => {
    const map = new Map();
    forms.forEach((form) => {
      if (form?.id) map.set(form.id, form);
    });
    return map;
  }, [forms]);

  const totalCount = formsMeta.totalCount ?? forms.length;
  const hasError = Boolean(error);
  const contentKey = `${sortValue}-${roleValue}-${allowAnonymous}-${allowMultiple}-${hasLinkedForm}-${requiresManualReview}-${debouncedSearch}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-6">
      <FormsHeader searchValue={searchValue} onSearchChange={setSearchValue} sortValue={sortValue} onSortChange={setSortValue} roleValue={roleValue} onRoleChange={setRoleValue}
        allowAnonymous={allowAnonymous} onAllowAnonymousChange={setAllowAnonymous} allowMultiple={allowMultiple} onAllowMultipleChange={setAllowMultiple} hasLinkedForm={hasLinkedForm}
        onHasLinkedFormChange={setHasLinkedForm} requiresManualReview={requiresManualReview} onRequiresManualReviewChange={setRequiresManualReview}
        onRefresh={() => refetch()} onCreate={() => router.push("/admin/forms/new-form")} stats={{ count: totalCount }}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <ListItemSkeleton count={3} />
          ) : hasError ? (
            <StateCard title={"Formlar yüklenemedi"} Icon={FileXCorner} description={"Form verileri yüklenirken hata oluştu."} />
          ) : forms.length === 0 ? (
            <StateCard title={"Form bulunamadı"} Icon={FileSearchCorner}
              description={searchValue !== "" ? "Aranılan kelimede form bulunamadı."
              : (roleValue !== null || allowAnonymous !== null || allowMultiple !== null || hasLinkedForm !== null || requiresManualReview !== null) ? "Verilen filtrelere uygun form bulunamadı."
              : "Erişiminiz olduğu bir form bulunamadı."
          }/>
          ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto pr-1 scrollbar">
              <div className="space-y-1.5">
                {forms.map((form) => {
                  const linkedForm = form?.linkedForm || null;
                  return (
                    <ListItem key={form.id} form={form} linkedForm={linkedForm}
                      viewHref={`/admin/forms/${form.id}`} editHref={`/admin/forms/${form.id}/edit`}
                    />
                  );
                })}
              </div>
            </div>
            <Pagination current={formsMeta.page ?? page}
              totalPages={formsMeta.totalPages ?? 1}
              totalCount={totalCount}
              pageSize={formsMeta.pageSize ?? forms.length}
              entriesLength={forms.length}
              onPageChange={setPage}
            />
          </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}