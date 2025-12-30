"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { FormsHeader } from "../components/Headers";
import ListItem, { ListItemSkeleton } from "../components/ListItem";
import { useUserFormsQuery } from "@/lib/hooks/useFormAdmin";

export default function FormsPage() {
  const router = useRouter();
  const { data: formsData, isLoading, error, refetch } = useUserFormsQuery();
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("recent");

  const forms = Array.isArray(formsData) ? formsData : [];

  const formsById = useMemo(() => {
    const map = new Map();
    forms.forEach((form) => {
      if (form?.id) map.set(form.id, form);
    });
    return map;
  }, [forms]);

  const filteredForms = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    let next = forms;

    if (query) {
      next = next.filter((form) => {
        const title = form?.title?.toLowerCase() ?? "";
        const id = form?.id?.toLowerCase() ?? "";
        return title.includes(query) || id.includes(query);
      });
    }

    const sorted = [...next];
    switch (sortValue) {
      case "responses":
        sorted.sort((a, b) => (b.responseCount ?? 0) - (a.responseCount ?? 0));
        break;
      case "alphabetic":
        sorted.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        break;
    }

    return sorted;
  }, [forms, searchValue, sortValue]);

  const hasError = Boolean(error);

  return (
    <div className="p-6 space-y-6">
      <FormsHeader searchValue={searchValue} onSearchChange={setSearchValue} sortValue={sortValue} onSortChange={setSortValue} onRefresh={() => refetch()} onCreate={() => router.push("/admin/forms/new-form")} stats={{ count: forms.length }} />
      {isLoading ? (
        <ListItemSkeleton count={3} />
      ) : hasError ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
          Forms could not be loaded.
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
          No forms found.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredForms.map((form) => {
            const linkedForm = form?.linkedFormId ? formsById.get(form.linkedFormId) : null;
            return (
              <ListItem key={form.id} form={form} linkedForm={linkedForm}
                viewHref={`/admin/forms/${form.id}?tab=responses`} editHref={`/admin/forms/${form.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
