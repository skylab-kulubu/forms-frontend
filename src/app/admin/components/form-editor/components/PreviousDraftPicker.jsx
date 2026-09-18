"use client";

import { useMemo, useState } from "react";
import { FileStack, Layers, Loader2 } from "lucide-react";
import { request } from "@/lib/apiClient";
import { useUserFormsQuery } from "@/lib/hooks/useFormAdmin";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import { cloneSchema, matchesGroupTemplate } from "@/lib/event-handoff";

export function PreviousDraftPicker({ ownerTeam, onApply, busy }) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const { data: formsData, isLoading: formsLoading } = useUserFormsQuery({
    page: 1,
    pageSize: 20,
    sortBy: "updatedAt",
    sortDirection: "descending",
  });
  const { data: groupsData, isLoading: groupsLoading } = useGroupsQuery({ pageSize: 50 });

  const forms = useMemo(() => {
    const items = formsData?.data?.items ?? [];
    return Array.isArray(items) ? items : [];
  }, [formsData]);

  const groups = useMemo(() => {
    const items = groupsData?.data?.items ?? [];
    const rows = Array.isArray(items) ? items : [];
    if (!ownerTeam) return rows.filter((group) => Array.isArray(group?.schema) && group.schema.length > 0);
    const matched = rows.filter(
      (group) => matchesGroupTemplate(group?.title, ownerTeam) && Array.isArray(group?.schema) && group.schema.length > 0,
    );
    return matched.length ? matched : rows.filter((group) => Array.isArray(group?.schema) && group.schema.length > 0);
  }, [groupsData, ownerTeam]);

  const loading = formsLoading || groupsLoading;
  const applying = Boolean(pending) || busy;

  async function applyForm(form) {
    if (!form?.id || applying) return;
    setPending(form.id);
    setError(null);
    try {
      const payload = await request(`/api/admin/forms/${form.id}`);
      const row = payload?.data ?? payload;
      const schema = cloneSchema(row?.schema);
      if (!schema.length) {
        setError("Bu taslakta soru yok.");
        return;
      }
      onApply({ schema, source: "form", label: row?.title || form.title });
    } catch (err) {
      setError(err?.message || "Taslak yüklenemedi");
    } finally {
      setPending(null);
    }
  }

  function applyGroup(group) {
    if (!group || applying) return;
    const schema = cloneSchema(group.schema);
    if (!schema.length) {
      setError("Bu grupta soru yok.");
      return;
    }
    onApply({ schema, source: "group", label: group.title });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-2xs text-neutral-500">
        <Loader2 size={14} className="animate-spin" />
        Taslaklar yükleniyor…
      </div>
    );
  }

  if (forms.length === 0 && groups.length === 0) {
    return (
      <p className="text-2xs text-neutral-500">
        Önceki bir taslak veya ekip şablonu bulunamadı. Kütüphaneden soru ekleyebilirsin.
      </p>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3 text-left">
      <div>
        <p className="text-sm font-semibold text-neutral-100">Daha önceki taslağa git</p>
        <p className="mt-1 text-2xs leading-relaxed text-neutral-500">
          Önceki formun soruları veya ekibe bağlı şablon bu taslağa kopyalanır. Yeni bir form kaydedilir.
        </p>
      </div>
      {groups.length > 0 ? (
        <ul className="space-y-1">
          {groups.slice(0, 6).map((group) => (
            <li key={group.id}>
              <button
                type="button"
                disabled={applying}
                onClick={() => applyGroup(group)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-left text-xs text-neutral-200 transition hover:border-skylab-400/40 hover:bg-skylab-500/10 disabled:opacity-60"
              >
                {pending === group.id ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} className="text-skylab-300" />}
                <span className="min-w-0 flex-1 truncate">{group.title}</span>
                <span className="text-3xs text-neutral-500">{Array.isArray(group.schema) ? group.schema.length : 0} soru</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {forms.length > 0 ? (
        <ul className="space-y-1">
          {forms.slice(0, 8).map((form) => (
            <li key={form.id}>
              <button
                type="button"
                disabled={applying}
                onClick={() => applyForm(form)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-left text-xs text-neutral-200 transition hover:border-skylab-400/40 hover:bg-skylab-500/10 disabled:opacity-60"
              >
                {pending === form.id ? <Loader2 size={14} className="animate-spin" /> : <FileStack size={14} className="text-neutral-400" />}
                <span className="min-w-0 flex-1 truncate">{form.title || "Adsız form"}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-2xs text-red-300">{error}</p> : null}
    </div>
  );
}
