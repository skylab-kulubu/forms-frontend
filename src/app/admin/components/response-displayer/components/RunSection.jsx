"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ListRestart, Loader2, RotateCcw } from "lucide-react";
import { StatePill } from "@/app/admin/components/utils/SidePanel";
import { useRunVoidMutation } from "@/lib/hooks/useResponse";
import { isDeletedUser } from "@/lib/deleted-user";
import { formatDay } from "@/lib/form-timing";
import { formatPersonName } from "./AttemptPanels";

const RUN_STATUS = { ACTIVE: 0, COMPLETED: 1, TERMINATED: 2, FAULTED: 3, VOIDED: 4 };
const RUN_OUTCOME = { APPROVED: 1, DECLINED: 2, TIMED_OUT: 3 };
const INTAKE = { NEW_RUNS_CLOSED: 1, CLOSED: 2 };
const NOTE_MAX_LENGTH = 500;

const BLOCK_COPY = {
  timedStep: "Süreli adımı olan akışta başvuru yeniden açılamaz.",
  workflowArchived: "Akış arşivlendiği için başvuru yeniden açılamaz.",
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

function pillOf(run) {
  switch (run.status) {
    case RUN_STATUS.VOIDED: return { tone: "neutral", label: "Geçersiz sayıldı" };
    case RUN_STATUS.ACTIVE: return { tone: "amber", label: "Devam ediyor" };
    case RUN_STATUS.COMPLETED: return { tone: "emerald", label: "Tamamlandı" };
    case RUN_STATUS.FAULTED: return { tone: "red", label: "Aktarılamadı" };
    default: return { tone: "red", label: "Sonlandı" };
  }
}

function summaryOf(run) {
  if (run.status === RUN_STATUS.ACTIVE) return "Başvuru sürüyor.";

  const day = formatDay(run.completedAt);
  const ended = run.outcome === RUN_OUTCOME.APPROVED
    ? `Başvuru ${day} tamamlandı.`
    : run.outcome === RUN_OUTCOME.TIMED_OUT
      ? `Başvuru ${day} teslim olmadan sonlandı.`
      : run.outcome === RUN_OUTCOME.DECLINED
        ? `Başvuru ${day} kabul edilmeden sonlandı.`
        : `Başvuru ${day} sonlandı.`;

  return run.allowMultipleRuns ? ended : `${ended} Bu akışta her aday bir kez başvurabiliyor.`;
}

function copyOf(run) {
  const intakeLine = run.intake === INTAKE.CLOSED
    ? "Akış şu an kapalı; aday akış açılınca başlayabilir."
    : run.intake === INTAKE.NEW_RUNS_CLOSED
      ? "Akış yeni başvurulara kapalı olsa da başlayabilir."
      : null;

  if (run.status === RUN_STATUS.ACTIVE) {
    return {
      Icon: ListRestart,
      action: "Başvuruyu baştan başlat",
      sub: "Devam eden başvuru kapanır, aday ilk adımdan başlar",
      lines: ["Devam eden başvuru kapanır; bekleyen cevap incelemeden çıkar.", "Aday ilk adımdan, boş bir formla başlar.", intakeLine].filter(Boolean),
      button: "Baştan başlat",
      danger: true,
    };
  }

  return {
    Icon: RotateCcw,
    action: "Yeniden başvuru hakkı ver",
    sub: "Bu başvuru kapanır, aday ilk adımdan başlar",
    lines: ["Bu başvuru geçersiz sayılır; cevapları başvuru geçmişinde kalır.", "Aday ilk adımdan, boş bir formla başlar.", intakeLine].filter(Boolean),
    button: "Hakkı ver",
    danger: false,
  };
}

function VoidedBlock({ run }) {
  // Başvuru sürerken geçersiz sayıldıysa kapanış ve geçersiz sayma aynı anda yazılır.
  const restarted = Boolean(run.completedAt) && run.completedAt === run.voidedAt;
  const voider = run.voidedBy;
  const voiderName = formatPersonName(voider?.fullName);
  const voiderSecondary = voider?.email || (voider?.id && !isDeletedUser(voider.id) ? `ID: ${voider.id}` : "");
  const voiderLabel = [voiderName, voiderSecondary].filter(Boolean).join(" • ");

  return (
    <div className="rounded-lg border border-white/10 bg-white/3 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-3xs font-medium text-neutral-500">{restarted ? "Başvuru baştan başlatıldı" : "Yeniden başvuru hakkı verildi"}</p>
        <span className="flex shrink-0 items-center gap-1 text-3xs text-neutral-400">
          <Clock size={10} className="shrink-0" />
          {formatDateTime(run.voidedAt)}
        </span>
      </div>
      {voiderLabel && <p className="truncate text-3xs text-neutral-400">{voiderLabel}</p>}
      {run.voidNote && <p className="mt-2 whitespace-pre-wrap text-2xs leading-relaxed text-neutral-200">{run.voidNote}</p>}
    </div>
  );
}

export default function RunSection({ run, instanceId, readOnly = false }) {
  const mutation = useRunVoidMutation();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const pill = pillOf(run);
  const voided = run.status === RUN_STATUS.VOIDED;
  const canVoid = !readOnly && Boolean(run.canVoid);
  const copy = copyOf(run);
  const blockCopy = !readOnly && !voided ? BLOCK_COPY[run.voidBlock] : null;

  const confirm = () => mutation.mutate({ instanceId, note: note.trim() }, {
    onSuccess: () => {
      setConfirming(false);
      setNote("");
    },
  });

  return (
    <div className="px-1 py-4 first:pt-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-2xs font-medium text-neutral-500">Başvuru</h3>
        <StatePill tone={pill.tone}>{pill.label}</StatePill>
      </div>

      {voided ? (
        <VoidedBlock run={run} />
      ) : (
        <p className="mb-3 text-2xs leading-relaxed text-neutral-400">{summaryOf(run)}</p>
      )}

      {blockCopy && <p className="text-3xs leading-relaxed text-neutral-500">{blockCopy}</p>}

      {canVoid && (
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="rounded-xl border border-white/10 bg-white/3 p-3"
            >
              <p className="text-xs font-medium text-neutral-100">{copy.action}</p>
              <ul className="mt-1.5 space-y-1">
                {copy.lines.map((line) => (
                  <li key={line} className="flex gap-2 text-2xs leading-relaxed text-neutral-300">
                    <span className="mt-1.75 size-1 shrink-0 rounded-full bg-neutral-500" />
                    {line}
                  </li>
                ))}
              </ul>
              <label htmlFor="run-void-note" className="mb-1.5 mt-3 block text-3xs font-medium text-neutral-500">Adaya gidecek not · isteğe bağlı</label>
              <textarea id="run-void-note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={NOTE_MAX_LENGTH}
                placeholder="Neden yeniden başvurabileceğini yazın"
                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-1 focus:ring-skylab-400/40"
              />
              <p className="mt-1.5 text-3xs leading-relaxed text-neutral-500">Aday e-postayla bilgilendirilir.</p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => setConfirming(false)} disabled={mutation.isPending}
                  className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
                >
                  Vazgeç
                </button>
                <button type="button" onClick={confirm} disabled={mutation.isPending}
                  className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-1.5 text-2xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60 ${copy.danger ? "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20" : "border-skylab-400/40 bg-skylab-500/10 text-skylab-200 hover:bg-skylab-500/20"}`}
                >
                  {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : copy.button}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button key="row" type="button" onClick={() => { mutation.reset(); setConfirming(true); }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${copy.danger ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
            >
              <copy.Icon size={16} className={`shrink-0 ${copy.danger ? "text-red-300" : "text-neutral-300"}`} />
              <span className="min-w-0">
                <span className={`block text-xs font-semibold ${copy.danger ? "text-red-200" : "text-neutral-100"}`}>{copy.action}</span>
                <span className="block text-3xs text-neutral-400">{copy.sub}</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {mutation.error && (
        <p role="alert" className="mt-2 text-3xs leading-relaxed text-red-300">
          {mutation.error.body?.message ?? mutation.error.message ?? "Başvuru yeniden açılamadı."}
        </p>
      )}
    </div>
  );
}
