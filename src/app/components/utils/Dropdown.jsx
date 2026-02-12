import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dropdown({ value, onChange, options = [], placeholder = "Seçiniz...", className = "", renderOption }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => (typeof opt === 'object' ? opt.value : opt) === value );
    const displayLabel = selectedLabel ? (typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel) : placeholder;

    const handleSelect = (option) => {const val = typeof option === 'object' ? option.value : option;
        onChange(val); setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-lg border bg-neutral-800/50 px-3 py-2.5 text-xs font-medium text-neutral-200 transition-all 
                ${isOpen ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : "border-white/10 hover:border-white/20 hover:bg-neutral-800"}`}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown size={14} className={`ml-2 text-neutral-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        className="absolute left-0 top-full z-30 mt-1 w-full rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl backdrop-blur-xl"
                    >
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent p-1">
                            {options.length > 0 ? options.map((option, idx) => {
                                const val = typeof option === 'object' ? option.value : option;
                                const label = typeof option === 'object' ? option.label : option;
                                const isSelected = val === value;

                                return (
                                    <button key={idx} type="button" onClick={() => handleSelect(option)}
                                        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs transition-colors
                                        ${isSelected ? "bg-indigo-500/20 text-indigo-200" : "text-neutral-300 hover:bg-white/5 hover:text-white"}`}
                                    >
                                        <span className="truncate pr-2">{renderOption ? renderOption(option) : label}</span>
                                        {isSelected && <Check size={12} className="text-indigo-400 shrink-0" />}
                                    </button>
                                );
                            }) : (
                                <div className="px-2 py-3 text-center text-xs text-neutral-500">Seçenek yok</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}