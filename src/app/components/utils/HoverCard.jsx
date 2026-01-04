"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getInitial(name, email) {
  const source = (name || email || "").trim();
  return source ? source[0].toUpperCase() : "?";
}

const panelVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1], when: "beforeChildren" } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1], when: "afterChildren" } },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: [0.4, 0, 0.2, 1] } },
};

export default function HoverCard({ user, children, openDelay = 1100, className = "" }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleEnter = () => {
    if (!user) return;
    clearTimer();
    timerRef.current = setTimeout(() => setOpen(true), openDelay);
  };

  const handleLeave = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => () => clearTimer(), []);

  const email = user?.email?.trim() || "";
  const id = user?.id?.trim() || "";
  const university = user?.university?.trim() || "";
  const faculty = user?.faculty?.trim() || "";
  const department = user?.department?.trim() || "";
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];
  const avatarUrl = user?.profilePictureUrl?.trim() || user?.image?.trim() || "";

  const displayName = user?.fullName.trim().toLocaleLowerCase("tr-TR").split(/\s+/)
    .map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR")))
    .join(" ") || "Kullanıcı";

  const initial = getInitial(displayName);

  const rows = [
    { label: "University", value: university || "--" },
    { label: "Faculty", value: faculty || "--" },
    { label: "Department", value: department || "--" },
  ];

  return (
    <div className={`relative inline-flex ${className}`} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {open ? (
          <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit"
            className="absolute left-1/2 top-full z-30 mt-2 w-80 -translate-x-1/2 rounded-xl border border-white/10 bg-neutral-800/40 p-3 text-neutral-100 shadow-2xl backdrop-blur-md"
          >
            <motion.div variants={contentVariants}>
              <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/3 p-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-neutral-800 text-xs font-semibold text-neutral-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-100">{displayName}</div>
                  <div className="truncate text-xs text-neutral-400">{email || "--"}</div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-1 flex items-center justify-start">
                <span className="p-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
                  ID: {id || "--"}
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-1 grid gap-2">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-wide text-neutral-500">{row.label}</span>
                    <span className="text-right text-xs text-neutral-200 break-all">{row.value}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="mt-2">
                {roles.length ? (
                  <div className="mt-1 w-full rounded-md text-center border border-white/8 bg-white/3 px-2 py-1 text-[11px] text-neutral-200">
                    {roles[0]}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-neutral-400">--</div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}