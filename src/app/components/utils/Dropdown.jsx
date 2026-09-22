import { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Floating } from "./Floating";

const SIZE_CLASS = {
    md: "rounded-lg px-3 py-2.5 text-xs",
    sm: "rounded-md px-2 py-1.5 text-2xs",
};

const isObject = (option) => typeof option === "object" && option !== null;
const valueOf = (option) => (isObject(option) ? option.value : option);
const labelOf = (option) => (isObject(option) ? option.label : option);

export function Dropdown({ value, onChange, options = [], placeholder = "Seçiniz...", className = "", renderOption, size = "md", tone = "", variant = "box" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selected = options.find((option) => valueOf(option) === value);
    const displayLabel = selected ? labelOf(selected) : placeholder;
    const isInline = variant === "inline";

    const handleSelect = (option) => {
        if (isObject(option) && option.disabled) return;
        onChange(valueOf(option));
        setIsOpen(false);
    };

    const triggerClass = isInline
        ? `inline-flex max-w-full items-center gap-0.5 rounded px-1 py-0.5 text-2xs font-medium transition-colors hover:bg-white/5 ${isOpen ? "bg-white/5" : ""} ${selected ? (tone || "text-neutral-100") : "text-neutral-500"}`
        : `flex w-full items-center justify-between border bg-neutral-800/50 font-medium transition-all ${SIZE_CLASS[size] ?? SIZE_CLASS.md} ${selected ? (tone || "text-neutral-200") : "text-neutral-500"}
            ${isOpen ? "border-skylab-400/50 ring-1 ring-skylab-400/20" : "border-white/10 hover:border-white/20 hover:bg-neutral-800"}`;

    return (
        <div className={`${isInline ? "relative inline-flex max-w-full" : "relative"} ${className}`} ref={containerRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={triggerClass}>
                <span className="truncate">{displayLabel}</span>
                <ChevronDown size={isInline ? 10 : size === "sm" ? 12 : 14}
                    className={`shrink-0 transition-transform duration-200 ${isInline ? "ml-0.5 text-neutral-600" : "ml-2 text-neutral-500"} ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Floating anchor={containerRef} onDismiss={() => setIsOpen(false)} offset={4} matchWidth={!isInline}>
                        <motion.div initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.1 }}
                            className={`rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl backdrop-blur-xl scrollbar ${isInline ? "min-w-44 max-w-72" : "w-full min-w-40"}`}
                        >
                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent p-1">
                                {options.length > 0 ? options.map((option, idx) => {
                                    const val = valueOf(option);
                                    const label = labelOf(option);
                                    const isSelected = val === value;
                                    const disabled = isObject(option) && Boolean(option.disabled);
                                    const hint = isObject(option) ? option.hint : null;

                                    return (
                                        <button key={idx} type="button" onClick={() => handleSelect(option)} disabled={disabled}
                                            className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors
                                            ${disabled ? "cursor-not-allowed text-neutral-600" : isSelected ? "bg-skylab-500/20 text-skylab-300" : "text-neutral-300 hover:bg-white/5 hover:text-white"}`}
                                        >
                                            <span className="truncate">{renderOption ? renderOption(option) : label}</span>
                                            {isSelected ? <Check size={12} className="shrink-0 text-skylab-400" /> : hint ? <span className="shrink-0 text-3xs text-neutral-600">{hint}</span> : null}
                                        </button>
                                    );
                                }) : (
                                    <div className="px-2 py-3 text-center text-xs text-neutral-500">Seçenek yok</div>
                                )}
                            </div>
                        </motion.div>
                    </Floating>
                )}
            </AnimatePresence>
        </div>
    );
}
