"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dot, Keyboard, X } from "lucide-react";
import { APPROVAL_PRESETS } from "./approval-presets";

export default function ApprovalOverlay({ open, preset, context = {}, onApprove, onReject }) {
  const config = APPROVAL_PRESETS[preset] ?? APPROVAL_PRESETS.default;

  const Icon = config.icon ?? Dot;
  const title = config.title ?? "Onay gerekiyor";
  const highlights = typeof config.highlights === "function" ? config.highlights(context) : Array.isArray(config.highlights) ? config.highlights : [];
  const approveLabel = typeof config.approveLabel === "function" ? config.approveLabel(context) : config.approveLabel ?? "Onaylıyorum";
  const rejectLabel = typeof config.rejectLabel === "function" ? config.rejectLabel(context) : config.rejectLabel ?? "Onaylamıyorum";
  const variant = config.variant ?? "phrase";
  const safeDelay = Math.max(0, Math.round(config.delaySeconds ?? 3));
  const mode = variant === "delayed" ? "delayed" : "phrase";
  const requiredPhrase = config.requiredPhrase ?? "Kabul ediyorum";

  const [typedValue, setTypedValue] = useState("");
  const [remaining, setRemaining] = useState(safeDelay);

  const checklist = useMemo(() => {
    if (Array.isArray(highlights) && highlights.length > 0) return highlights;
    return [];
  }, [highlights]);

  useEffect(() => {
    if (!open) {
      setTypedValue("");
      setRemaining(safeDelay);
      return;
    }

    if (mode !== "delayed") return;

    setRemaining(safeDelay);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, safeDelay - elapsed);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [open, mode, safeDelay]);

  const canApprove =
    mode === "phrase"
      ? typedValue.trim().toLowerCase() === requiredPhrase.trim().toLowerCase()
      : remaining <= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="approval-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-950/10 via-blue-900/5 to-transparent" aria-hidden />

          <div className="relative w-full max-w-3xl px-4 sm:px-6">
            <motion.div key="approval-card" 
              initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-linear-to-br from-emerald-900/25 via-cyan-700/15 to-indigo-500/10 text-white shadow-inner">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-50">{title}</p>
                  </div>
                </div>

                <button type="button" onClick={() => onReject?.()} aria-label="Kapat"
                  className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div className={`rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 ${mode === "phrase" ? "block" : "hidden"}`}>
                  <p className="text-sm font-semibold text-neutral-100">
                    Yazılı Onay
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-400">
                    Devam etmek için aşağıdaki ifadeyi eksiksiz olarak yazın:
                  </p>
                  {mode === "phrase" && (
                    <div className="mt-3 space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-100">
                        <Keyboard size={14} />
                        <span>{requiredPhrase}</span>
                      </div>
                      <input type="text" value={typedValue} onChange={(event) => setTypedValue(event.target.value)} placeholder={requiredPhrase}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2.5 text-sm text-neutral-50 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-4">
                  <p className="text-sm font-semibold text-neutral-100">İşlem Özeti</p>
                  <ul className="mt-2 space-y-2 text-sm text-neutral-300">
                    {checklist.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Dot size={16} className="mt-1 text-emerald-400" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/5 bg-neutral-900/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <button type="button" onClick={() => onReject?.()}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {rejectLabel}
                  </button>
                  <button type="button" disabled={!canApprove} onClick={() => { if (!canApprove) return; onApprove?.();}}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 ${canApprove ? "bg-emerald-500/80 border border-emerald-800 text-neutral-100 hover:from-emerald-400 hover:to-emerald-300" : "cursor-not-allowed border-transparent bg-neutral-800 text-neutral-500"}`}
                  >
                    {mode === "delayed" && remaining > 0 ? `${approveLabel} (${remaining}s)` : approveLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
