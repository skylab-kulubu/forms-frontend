"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Info } from "lucide-react";

const variantStyles = {
  error: {
    container: "border-red-500/20 bg-[#1f1414]",
    arrow: "bg-[#1f1414] border-red-500/20",
    iconClass: "text-red-200/30",
    Icon: AlertCircle,
  },
  info: {
    container: "border-neutral-500/20 bg-neutral-700",
    arrow: "bg-neutral-700 border-neutral-500/20",
    iconClass: "text-neutral-300/50",
    Icon: Info,
  },
};

export default function Popover({ open, error, message, variant = "error", children, align = "top-center", className = "", onClose }) {
  const displayMessage = message || error?.response?.data?.message || error?.data?.message || error?.message || "Beklenmeyen bir hata olustu.";
  const shouldShow = open && (message || error);

  const style = variantStyles[variant] || variantStyles.error;
  const IconComponent = style.Icon;

  const isTop = align.startsWith("top");

  const positionClasses = {
    "top-center": "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    "top-left": "bottom-full left-0 mb-2.5",
    "top-right": "bottom-full right-0 mb-2.5",
    "bottom-center": "top-full left-1/2 -translate-x-1/2 mt-2.5",
    "bottom-left": "top-full left-0 mt-2.5",
    "bottom-right": "top-full right-0 mt-2.5",
  }[align] || "bottom-full left-1/2 -translate-x-1/2 mb-2.5";

  const arrowClasses = {
    "top-center": "bottom-[-4.5px] left-1/2 -translate-x-1/2 border-b border-r",
    "top-left": "bottom-[-4.5px] left-2 border-b border-r",
    "top-right": "bottom-[-4.5px] right-2 border-b border-r",
    "bottom-center": "top-[-4.5px] left-1/2 -translate-x-1/2 border-t border-l",
    "bottom-left": "top-[-4.5px] left-2 border-t border-l",
    "bottom-right": "top-[-4.5px] right-2 border-t border-l",
  }[align] || "bottom-[-4.5px] left-1/2 -translate-x-1/2 border-b border-r";

  const variants = {
    hidden: { opacity: 0, y: isTop ? 4 : -4, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: isTop ? 2 : -2, scale: 0.96, transition: { duration: 0.12, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      <AnimatePresence>
        {shouldShow ? (
          <motion.div variants={variants} initial="hidden" animate="visible" exit="exit"
            className={`absolute z-50 flex w-max max-w-[220px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-xl ${style.container} ${positionClasses}`}
            onClick={onClose}
            style={onClose ? { cursor: "pointer" } : undefined}
          >
            <div className={`absolute h-2.5 w-2.5 rotate-45 rounded-[2.5px] ${style.arrow} ${arrowClasses}`} style={{ zIndex: -1 }}/>

            <IconComponent size={13} strokeWidth={2.5} className={`shrink-0 ${style.iconClass}`} />
            <span className="text-[10px] font-medium leading-snug text-neutral-200 wrap-break-word">
              {displayMessage}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}