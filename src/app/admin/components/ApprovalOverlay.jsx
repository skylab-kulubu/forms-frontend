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

  const canApprove = mode === "phrase" ? typedValue.trim().toLowerCase() === requiredPhrase.trim().toLowerCase() : remaining <= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="approval-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex h-dvh w-dvw items-center justify-center bg-neutral-950/20 backdrop-blur-sm px-4"
        >
          
          <motion.div key="approval-card" 
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-400/10 text-indigo-400">
                  <Icon size={16} />
                </div>
                <h2 className="text-base font-medium text-neutral-100">{title}</h2>
              </div>

              <button type="button" onClick={() => onReject?.()} aria-label="Kapat"
                className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-200">İşlem Özeti</h3>
                <ul className="mt-3 space-y-2">
                  {checklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-neutral-400">
                      <Dot size={16} className="mt-0.5 shrink-0 text-indigo-400/70" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {mode === "phrase" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-200">
                      Yazılı Onay
                    </label>
                    <div className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400">
                      <Keyboard size={14} />
                      <span>Gereken metin: <span className="font-semibold text-neutral-300 select-all">{requiredPhrase}</span></span>
                    </div>
                  </div>
                  <input type="text" value={typedValue} onChange={(event) => setTypedValue(event.target.value)} placeholder={requiredPhrase}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-neutral-900/30 px-5 py-4">
              <button type="button" onClick={() => onReject?.()}
                className="h-9 rounded-lg px-4 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                {rejectLabel}
              </button>
              
              <button type="button" disabled={!canApprove} onClick={() => { if (!canApprove) return; onApprove?.();}}
                className={`h-9 rounded-lg px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
                  canApprove ? "border border-indigo-400/30 bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20" 
                  : "cursor-not-allowed border border-white/5 bg-neutral-800/50 text-neutral-500"
                }`}
              >
                {mode === "delayed" && remaining > 0 ? `${approveLabel} (${remaining}s)` : approveLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}