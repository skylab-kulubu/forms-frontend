"use client";

import { useState, useEffect } from "react";
import { GitBranch, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConditionSelector } from "../../admin/components/form-editor/components/ConditionSelector";

export const LOCKED_OPTION_HINT = "Akış koşulu bu seçeneği karşılaştırıyor; adı değiştirilemez ve silinemez.";

const LOCKED_QUESTION_HINT = "Yayındaki bir akışın koşulu bu soruyu okuyor; soru silinemez.";

export function FieldShell({ number, title, required, onRequiredChange, children, condition, onConditionChange, availableFields, hideRequired = false, compact = false, workflowLock = null }) {
  const [showLogic, setShowLogic] = useState(false);

  const hasActiveCondition = condition && condition.fieldId;
  const isFirst = number === 1 || !availableFields || availableFields.length === 0;

  useEffect(() => {
    if (condition?.fieldId && availableFields) {
      const targetStillExists = availableFields.find(f => f.id === condition.fieldId);
      if (!targetStillExists) {
        onConditionChange(null);
        setShowLogic(false);
      }
    }
  }, [condition, availableFields, onConditionChange]);

  if (compact) {
    return <div className="flex flex-col gap-3">{children}</div>;
  }

  return (
    <div className={`mx-auto w-full max-w-2xl rounded-xl border shadow-lg shadow-black/20 transition-all duration-300 group relative
      ${hasActiveCondition ? "bg-neutral-900 border-skylab-400/30 shadow-skylab-500/5" : "bg-neutral-900 border-white/10 hover:border-white/15 focus-within:border-skylab-400/40"}`}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5">
        <div className={`grid size-6 place-items-center rounded-md border text-xs font-semibold transition-colors
          ${hasActiveCondition ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400 group-hover:text-neutral-200"}`}>
          {number}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-200">
            {title || <span className="text-neutral-500 italic font-normal">Sorunuzu yazın...</span>}
          </span>
          {workflowLock && (
            <span title={LOCKED_QUESTION_HINT}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-3xs text-neutral-400"
            >
              <Lock size={10} />
              <span className="hidden sm:inline">Akış koşulu</span>
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center">
          <button type="button" disabled={isFirst}
            onClick={() => setShowLogic(!showLogic)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-2xs font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40
              ${isFirst ? "opacity-30 cursor-not-allowed bg-white/3 text-neutral-500 border-neutral-600" : ""}
              ${!isFirst && (hasActiveCondition || showLogic) ? "bg-skylab-500/10 text-skylab-300 border-skylab-400/20"
                : !isFirst && "border-white/15 bg-white/5 text-neutral-400 hover:text-neutral-200"
              }`}
          >
            <GitBranch size={13} />
            {hasActiveCondition ? "Aktif" : "Koşul"}
          </button>

          {!hideRequired && (
            <>
              <div className="h-5 w-px bg-white/10 mx-2"></div>

              <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
                <button type="button" aria-pressed={!required} onClick={() => onRequiredChange(false)}
                  className={`px-2 py-1 text-2xs rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${!required ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}>
                  Opsiyonel
                </button>
                <button type="button" aria-pressed={required} onClick={() => onRequiredChange(true)}
                  className={`px-2 py-1 text-2xs rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${required ? "bg-skylab-400/20 text-skylab-300" : "text-neutral-300 hover:text-neutral-200"}`}>
                  Zorunlu
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-0 flex flex-col gap-3 p-3 md:p-4">
        {children}
      </div>

      <AnimatePresence initial={false}>
        {showLogic && (
          <motion.div key="logic-panel" initial="collapsed" animate="open" exit="collapsed"
            variants={{
              open: { height: "auto", opacity: 1 },
              collapsed: { height: 0, opacity: 0 }
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ConditionSelector condition={condition} onUpdate={onConditionChange} availableFields={availableFields} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}