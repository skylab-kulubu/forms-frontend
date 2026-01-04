"use client";

import { motion } from "framer-motion";

const textVariants = {
  initial: { y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeIn" } },
  hover: { y: -20, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const iconVariants = {
  initial: { y: 20, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } },
  hover: { y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeIn", delay: 0.05 } },
};

export default function LoginButton({ onClick, disabled = false, label = "E-Skylab ile giriş yap", className = "" }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled} initial="initial" whileHover="hover"
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition-colors hover:border-pink-100/40 hover:bg-pink-100/30 hover:text-pink-100 ${className}`}
    >
      <div className="relative flex flex-col items-center justify-center overflow-hidden">
        <motion.span variants={textVariants} className="block whitespace-nowrap">
          {label}
        </motion.span>

        <motion.span variants={iconVariants} className="absolute inset-0 flex items-center justify-center">
          <img src="/skylab.svg" alt="Skylab" className="h-4 w-4 object-contain" />
        </motion.span>
      </div>
    </motion.button>
  );
}