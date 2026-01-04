"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
    const childOnClick = children.props?.onClick;
    return cloneElement(children, {
      ...props,
      onClick: (event) => {
        childOnClick?.(event);
        if (event.defaultPrevented) return;
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
    const childOnClick = children.props?.onClick;
    return cloneElement(children, {
      ...props,
      onClick: (event) => {
        childOnClick?.(event);
        if (event.defaultPrevented) return;
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

export function DrawerContent({ children, side = "right", className = "", overlayClassName = "", closeOnOverlayClick = false, ...props }) {
  const { open, setOpen } = useDrawerContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!mounted) return null;

  const wrapperClassName = "fixed inset-0 z-50";

  const sideClasses = {
    right: "inset-y-0 right-0 w-[min(92vw,420px)] border-l border-neutral-800",
    left: "inset-y-0 left-0 w-[min(92vw,420px)] border-r border-neutral-800",
    bottom: "inset-x-0 bottom-0 h-[min(90vh,520px)] border-t border-neutral-800",
    top: "inset-x-0 top-0 h-[min(90vh,520px)] border-b border-neutral-800",
  };

  const motionOffset = {
    right: { x: 24, y: 0 },
    left: { x: -24, y: 0 },
    bottom: { x: 0, y: 24 },
    top: { x: 0, y: -24 },
  };

  const overlayPointer = closeOnOverlayClick ? "pointer-events-auto" : "pointer-events-none";
  const overlayClasses = `absolute inset-0 bg-black/50 backdrop-blur-sm ${overlayPointer} ${overlayClassName}`;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className={wrapperClassName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={overlayClasses}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? () => setOpen(false) : undefined}
          />
          <motion.div role="dialog" aria-modal="true"
            className={`absolute flex h-full flex-col overflow-hidden bg-neutral-950/95 shadow-2xl ${sideClasses[side]} ${className}`}
            initial={motionOffset[side]} animate={{ x: 0, y: 0 }} exit={motionOffset[side]} transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
            {...props}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export function DrawerHeader({ className = "", ...props }) {
  return (
    <div className={`flex items-center justify-between border-b border-neutral-800 px-4 py-3 ${className}`} {...props} />
  );
}

export function DrawerTitle({ className = "", ...props }) {
  return (
    <h3 className={`text-sm font-semibold text-neutral-100 ${className}`} {...props} />
  );
}

export function DrawerDescription({ className = "", ...props }) {
  return (
    <p className={`text-xs text-neutral-500 ${className}`} {...props} />
  );
}

export function DrawerFooter({ className = "", ...props }) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-neutral-800 px-4 py-3 ${className}`} {...props} />
  );
}