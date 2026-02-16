"use client";

import { useState, useEffect } from "react";
import { GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConditionSelector } from "../../admin/components/form-editor/components/ConditionSelector";

export function FieldShell({ number, title, required, onRequiredChange, children, condition, onConditionChange, availableFields }) {
  const [showLogic, setShowLogic] = useState(false);
  const [isOverflowVisible, setIsOverflowVisible] = useState(false);

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

  const handleAnimationComplete = (definition) => {
    if (definition === "open") {
      setIsOverflowVisible(true);
    }
  };

  const handleAnimationStart = (definition) => {
    if (definition === "collapsed") {
      setIsOverflowVisible(false);
    }
  };

  return (
    <div className={`mx-auto w-full max-w-2xl rounded-xl border transition-all duration-300 group relative ${showLogic ? "z-20" : "z-0"} 
      ${hasActiveCondition ? "bg-neutral-900 border-indigo-500/30 shadow-indigo-500/5" : "bg-neutral-900 border-white/5 hover:border-white/10"}`}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5">
        <div className={`grid size-6 place-items-center rounded-md border text-[13px] font-semibold transition-colors
          ${hasActiveCondition ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200" : "border-white/10 bg-white/5 text-neutral-400 group-hover:text-neutral-200"}`}>
          {number}
        </div>

        <span className="text-sm font-medium text-neutral-200 truncate flex-1">
          {title || <span className="text-neutral-500 italic font-normal">Sorunuzu yazın...</span>}
        </span>

        <div className="ml-auto flex items-center">
          <button type="button" disabled={isFirst}
            onClick={() => { if (showLogic) setIsOverflowVisible(false); setShowLogic(!showLogic); }}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border
              ${isFirst ? "opacity-30 cursor-not-allowed bg-white/3 text-neutral-500 border-neutral-600" : ""}
              ${!isFirst && (hasActiveCondition || showLogic) ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                : !isFirst && "border-white/15 bg-white/5 text-neutral-400 hover:text-neutral-200"
              }`}
          >
            <GitBranch size={13} />
            {hasActiveCondition ? "Aktif" : "Koşul"}
          </button>

          <div className="h-5 w-px bg-white/10 mx-2"></div>


          <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
            <button type="button" aria-pressed={!required} onClick={() => onRequiredChange(false)}
              className={`px-2 py-1 text-[11px] rounded-lg ${!required ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}>
              Opsiyonel
            </button>
            <button type="button" aria-pressed={required} onClick={() => onRequiredChange(true)}
              className={`px-2 py-1 text-[11px] rounded-lg ${required ? "bg-indigo-400/20 text-indigo-200" : "text-neutral-300 hover:text-neutral-200"}`}>
              Zorunlu
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-0 flex flex-col gap-3 p-3 md:p-4">
        {children}
      </div>

      <AnimatePresence initial={false}>
        {showLogic && (
          <motion.div key="logic-panel" initial="collapsed" animate="open" exit="collapsed"
            onAnimationComplete={handleAnimationComplete}
            onAnimationStart={handleAnimationStart}
            variants={{
              open: { height: "auto", opacity: 1 },
              collapsed: { height: 0, opacity: 0 }
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: isOverflowVisible ? "visible" : "hidden" }}
            className="relative z-10"
          >
            <ConditionSelector condition={condition} onUpdate={onConditionChange} availableFields={availableFields} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}