"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronsRight } from "lucide-react";

const DrawerContext = createContext(null);

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("Drawer components must be used within <Drawer />.");
  }
  return context;
}

export function Drawer({ open: openProp, defaultOpen = false, onOpenChange, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback((value) => {
    const nextValue = typeof value === "function" ? value(open) : value;
    if (!isControlled) {
      setUncontrolledOpen(nextValue);
    }
    onOpenChange?.(nextValue);
  }, [isControlled, onOpenChange, open]);

  const contextValue = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger({ asChild = false, children, onClick, ...props }) {
  const { setOpen } = useDrawerContext();

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    setOpen(true);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      onClick: (event) => {
        children.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DrawerClose({ asChild = false, children, onClick, ...props }) {
  const { setOpen } = useDrawerContext();

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    setOpen(false);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      onClick: (event) => {
        children.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DrawerContent({ children, className = "", overlayClassName = "", closeOnOverlayClick = true, ...props }) {
  const { open, setOpen } = useDrawerContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!mounted) return null;

  const overlayClasses = `absolute inset-0 bg-neutral-900/10 backdrop-blur-[1px] transition-all duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} ${overlayClassName}`;

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 overflow-hidden">
          <motion.div className={overlayClasses} onClick={closeOnOverlayClick ? () => setOpen(false) : undefined}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />

          <motion.div  role="dialog"  aria-modal="true" className="absolute inset-y-0 right-0 flex h-full pointer-events-none" 
            initial={{ x: "100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }} {...props}
          >
            
            <button type="button" onClick={() => setOpen(false)}
              className="group pointer-events-auto relative flex w-5 -mr-0.5 h-full flex-col items-center justify-center rounded-l-full border-y border-l border-neutral-800 bg-[#121212] text-neutral-500 transition-colors hover:text-neutral-300 focus:outline-none"
              title="Paneli kapat"
            >
              <ChevronsRight size={14} strokeWidth={2.5} className="opacity-60 transition-transform duration-200 group-hover:scale-110 group-hover:opacity-100" />
            </button>

            <div className={`pointer-events-auto h-full w-[min(92vw,420px)] overflow-hidden border-y border-r border-l-0 border-neutral-800 bg-[#121212] shadow-2xl ${className}`}>
              {children}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}