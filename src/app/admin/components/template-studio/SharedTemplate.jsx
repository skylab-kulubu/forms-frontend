"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleGauge, CopyPlus, LayoutTemplate, Timer } from "lucide-react";
import { useCloneGroupMutation } from "@/lib/hooks/useGroupShare";
import Popover from "@/app/components/utils/Popover";
import Avatar from "@/app/components/utils/Avatar";
import { PANEL_SECTION, PANEL_STACK, SectionHeader } from "@/app/admin/components/utils/SidePanel";
import { CARD_WIDTH, CardShell, DisplayFields } from "../form-studio/StudioCard";

const PRIMARY = "flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-3 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60";

const formatName = (raw) => {
  if (!raw) return "";
  return raw.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((word) => word.replace(/^\p{L}/u, (char) => char.toLocaleUpperCase("tr-TR"))).join(" ");
};

const remainingOf = (expiresAt) => {
  if (!expiresAt) return null;
  const left = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(left)) return null;
  if (left <= 0) return "Süresi doldu";
  const hours = Math.floor(left / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} gün ${hours % 24} saat kaldı`;
  return hours > 0 ? `${hours} saat kaldı` : `${Math.floor(left / 60_000)} dakika kaldı`;
};

export default function SharedTemplate({ group, token }) {
  const router = useRouter();
  const { mutate: cloneGroup, isPending, isError, error, isSuccess, reset } = useCloneGroupMutation();
  const schema = Array.isArray(group?.schema) ? group.schema : [];
  const sharedBy = group?.sharedBy ?? null;
  const questionCount = schema.filter((field) => field.type !== "separator").length;
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isError) return undefined;
    const timer = setTimeout(() => reset(), 3000);
    return () => clearTimeout(timer);
  }, [isError, reset]);

  const handleClone = () => {
    if (!group?.id || isPending) return;
    cloneGroup({ groupId: group.id, token }, {
      onSuccess: (data) => {
        const next = (data?.data ?? data)?.id;
        if (next) router.push(`/admin/templates/${next}`);
      },
    });
  };

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-y-auto scrollbar lg:flex-row lg:overflow-hidden">
      <main className="relative order-2 min-w-0 flex-1 lg:order-1 lg:flex-[1_1_784px] lg:py-2">
        <div className="relative h-full overflow-hidden rounded-xl">
          <div className="studio-fade h-full overflow-x-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px] bg-local [scrollbar-gutter:stable] scrollbar lg:overflow-y-auto">
            <div className="relative mx-auto flex w-full flex-col px-3 pb-12 pt-4 sm:px-14 sm:pt-10" style={{ maxWidth: CARD_WIDTH.desktop + 112 }}>
              <div className="mb-2 flex items-center gap-1.5 px-1 text-2xs font-medium text-neutral-400">
                <LayoutTemplate size={12} className="shrink-0 text-neutral-500" />
                Paylaşılan şablon · {questionCount} soru
              </div>
              <h1 className="mb-1 px-1 text-xl font-semibold tracking-tight text-neutral-50 sm:text-2xl">{group?.title || "Adsız şablon"}</h1>
              {group?.description ? <p className="mb-1 px-1 text-xs text-neutral-400">{group.description}</p> : null}
              <div className="mx-auto mt-3 w-full" style={{ maxWidth: CARD_WIDTH.desktop }}>
                <CardShell active>
                  <div className="pointer-events-none select-none">
                    <DisplayFields fields={schema} />
                  </div>
                </CardShell>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="order-1 shrink-0 lg:order-2 lg:h-full lg:min-w-80 lg:flex-[0_1_440px] lg:py-2 lg:pr-2">
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="hidden h-10 min-w-0 shrink-0 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide text-neutral-200 lg:flex">Paylaşılan şablon</div>
          <div className={`${PANEL_STACK} min-h-0 flex-1 overflow-y-auto scrollbar`}>
            <section className={PANEL_SECTION}>
              <SectionHeader title="Paylaşan" />
              <div className="flex items-center gap-3">
                <Avatar name={sharedBy?.fullName ? formatName(sharedBy.fullName) : ""} photoUrl={sharedBy?.profilePictureUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-100">{formatName(sharedBy?.fullName) || "Bilinmiyor"}</p>
                  {sharedBy?.email ? <p className="truncate text-2xs text-neutral-500">{sharedBy.email}</p> : null}
                </div>
              </div>
            </section>

            <section className={PANEL_SECTION}>
              <SectionHeader title="Kendi şablonlarına ekle" description="Bir kopyası hesabına eklenir ve düzenlemek için açılır. Paylaşanın şablonu değişmez." />
              <Popover open={isError} error={error} variant="error" align="bottom-right">
                <button type="button" onClick={handleClone} disabled={isPending || isSuccess} className={PRIMARY}>
                  {isPending ? <CircleGauge size={14} className="animate-spin" /> : isError ? <CircleAlert size={14} /> : <CopyPlus size={14} />}
                  {isPending ? "Ekleniyor..." : isError ? "Hata oluştu" : isSuccess ? "Eklendi" : "Kendime ekle"}
                </button>
              </Popover>
              <p className="flex items-center gap-1.5 text-2xs text-neutral-500">
                <Timer size={12} className="shrink-0" />
                {remainingOf(group?.shareExpiresAt) ?? "Bağlantı 48 saat geçerlidir"}
              </p>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}
