"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { GroupsHeader } from "../components/Headers";
import Pagination from "../components/utils/Pagination";
import { useGroupsQuery, useDeleteGroupMutation } from "@/lib/hooks/useGroupAdmin";
import StateCard from "@/app/components/StateCard";
import ApprovalOverlay from "../components/ApprovalOverlay";
import { COMPONENTS } from "@/app/components/form-registry";
import { Layers, GripVertical, SearchX, Hash, PencilLine, Trash2 } from "lucide-react";

const componentMap = new Map(COMPONENTS.map((c) => [c.type, c]));

function getComponentInfo(type) {
  const comp = componentMap.get(type);
  return { Icon: comp?.icon ?? Hash, label: comp?.label ?? type };
}

function GroupCard({ group, index: cardIndex, onDelete }) {
  const schema = Array.isArray(group.schema) ? group.schema : [];
  const preview = schema.slice(0, 4);
  const remaining = schema.length - 4;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: cardIndex * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-white/8 bg-neutral-900/80 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-neutral-100 truncate">{group.title || "--"}</h3>
          {group.description && (
            <p className="text-[10px] text-neutral-500 truncate mt-0.5">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onDelete?.(group)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-600 hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Sil"
          >
            <Trash2 size={12} />
          </button>
          <a href={`/admin/component-groups/${group.id}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:text-indigo-300 hover:bg-white/5 transition-colors"
            title="Düzenle"
          >
            <PencilLine size={12} />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-2">
        <span className="text-[9px] font-medium text-neutral-600 uppercase tracking-wider">{schema.length} bileşen</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {schema.length === 0 ? (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center py-5 rounded-lg border border-dashed border-white/6">
            <p className="text-[10px] text-neutral-600">Boş grup</p>
          </div>
        </div>
      ) : (
        <div className="px-3 pb-3 space-y-0.5">
          {preview.map((field, i) => {
            const { Icon, label } = getComponentInfo(field.type);
            return (
              <motion.div key={field.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: cardIndex * 0.06 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="group/row flex items-center gap-2 rounded-md pl-1.5 pr-2.5 py-1 hover:bg-white/3 transition-colors"
              >
                <GripVertical size={10} className="shrink-0 text-neutral-800 group-hover/row:text-neutral-600 transition-colors" />
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white/4 border border-white/6">
                  <Icon size={10} className="text-neutral-500 group-hover/row:text-neutral-300 transition-colors" />
                </div>
                <span className="flex-1 text-[11px] text-neutral-400 group-hover/row:text-neutral-200 truncate transition-colors">
                  {field.props?.question || label}
                </span>
              </motion.div>
            );
          })}

          {remaining > 0 && (
            <div className="pl-7 pt-0.5">
              <span className="text-[9px] text-neutral-600">+{remaining} daha</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function GroupCardSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="rounded-xl border border-white/8 bg-neutral-900/80 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="shimmer h-3.5 w-24 rounded" />
          <div className="shimmer h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="shimmer h-2.5 w-12 rounded" />
        <div className="flex-1 h-px bg-white/4" />
      </div>
      <div className="px-3 pb-3 space-y-0.5">
        {Array.from({ length: 3 }, (_, j) => (
          <div key={j} className="flex items-center gap-2 rounded-md pl-1.5 pr-2.5 py-1">
            <div className="shimmer h-2.5 w-2.5 rounded" />
            <div className="shimmer h-5 w-5 rounded" />
            <div className="shimmer h-2.5 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  ));
}

export default function ComponentGroupsPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { mutate: deleteGroup, isPending: isDeletePending } = useDeleteGroupMutation();

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 500);
    return () => clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [debouncedSearch]);

  const { data: groupsData, isLoading, error, refetch } = useGroupsQuery({ page, search: debouncedSearch || undefined });

  const groupsMeta = groupsData?.data ?? {};
  const groups = Array.isArray(groupsMeta.items) ? groupsMeta.items : [];

  const totalCount = groupsMeta.totalCount ?? groups.length;
  const hasError = Boolean(error);
  const contentKey = `${debouncedSearch}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-6">
      <GroupsHeader searchValue={searchValue} onSearchChange={setSearchValue}
        onRefresh={() => refetch()} onCreate={() => router.push("/admin/component-groups/new-group")} stats={{ count: totalCount }}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pb-4">
              <GroupCardSkeleton count={6} />
            </div>
          ) : hasError ? (
            <StateCard title="Gruplar yüklenemedi" Icon={SearchX} description="Grup verileri yüklenirken hata oluştu." />
          ) : groups.length === 0 ? (
            <StateCard title="Grup bulunamadı" Icon={Layers}
              description={searchValue !== "" ? "Aranılan kelimede grup bulunamadı." : "Henüz bir bileşen grubu oluşturmadınız."}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pb-4">
                  {groups.map((group, i) => (
                    <GroupCard key={group.id} group={group} index={i} onDelete={setDeleteTarget} />
                  ))}
                </div>
              </div>
              <Pagination current={groupsMeta.page ?? page}
                totalPages={groupsMeta.totalPages ?? 1}
                totalCount={totalCount}
                pageSize={groupsMeta.pageSize ?? groups.length}
                entriesLength={groups.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ApprovalOverlay open={Boolean(deleteTarget)} preset="delete-form" context={{ isPending: isDeletePending }}
        onApprove={() => deleteGroup(deleteTarget?.id, { onSuccess: () => { setDeleteTarget(null); refetch(); }, onError: () => setDeleteTarget(null) })}
        onReject={() => setDeleteTarget(null)}
      />
    </div>
  );
}