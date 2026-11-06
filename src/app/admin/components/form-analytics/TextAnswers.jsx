"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PanelInput } from "@/app/admin/components/utils/SidePanel";
import { questionAnswersQuery } from "@/lib/hooks/useFormAdmin";
import { personOf, shortWhen } from "../form-responses/response-data";

export default function TextAnswers({ formId, questionId, filter = null, onOpen }) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const result = useQuery({ ...questionAnswersQuery(formId, questionId, { page, search, filter }), enabled: Boolean(formId && questionId), placeholderData: keepPreviousData, staleTime: 30_000 });
  const data = result.data?.data ?? null;
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const pages = Math.max(1, data?.totalPages ?? 1);

  const submit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(draft.trim());
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit}>
        <PanelInput value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Cevaplarda ya da kişilerde ara" aria-label="Bu sorunun cevaplarında ara" />
      </form>
      {result.isPending ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2].map((index) => <span key={index} className="shimmer block h-14 rounded-lg" />)}
        </div>
      ) : result.isError ? (
        <p className="text-2xs text-neutral-500">Cevaplar yüklenemedi.</p>
      ) : items.length === 0 ? (
        <p className="text-2xs text-neutral-500">{search ? "Aranan ifade bu sorunun cevaplarında yok." : filter?.status || filter?.sinceDays || filter?.answer ? "Süzgece uyan yazılı cevap yok." : "Bu soruya henüz yazılı cevap gelmedi."}</p>
      ) : (
        <div className={`divide-y divide-white/5 transition-opacity ${result.isPlaceholderData ? "opacity-60" : ""}`}>
          {items.map((item) => {
            const person = personOf(item);
            return (
              <button key={item.responseId} type="button" onClick={() => onOpen?.(item.responseId)}
                className="group block w-full py-2.5 text-left"
              >
                <span className="line-clamp-3 whitespace-pre-line text-2xs leading-relaxed text-neutral-200 group-hover:text-neutral-50">{item.answer}</span>
                <span className="mt-1 flex items-center gap-1.5 text-3xs text-neutral-500">
                  <span className="min-w-0 truncate">{person.name}</span>
                  <span className="shrink-0 tabular-nums">· {shortWhen(item.submittedAt)}</span>
                  <ChevronRight size={11} className="ml-auto shrink-0 text-neutral-600 transition-colors group-hover:text-skylab-300" />
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between text-3xs text-neutral-600">
        <span className="tabular-nums">{search ? `${total} sonuç` : `${total} yazılı cevap`}</span>
        {pages > 1 ? (
          <span className="flex items-center gap-0.5">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} aria-label="Önceki sayfa"
              className="grid size-6 place-items-center rounded text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:text-neutral-700"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-1 tabular-nums text-neutral-400">{page} / {pages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages} aria-label="Sonraki sayfa"
              className="grid size-6 place-items-center rounded text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:text-neutral-700"
            >
              <ChevronRight size={13} />
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
