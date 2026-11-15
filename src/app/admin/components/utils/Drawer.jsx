"use client";

import { isValidElement, useState } from "react";
import {
  Drawer as SkylcnDrawer, DrawerClose as SkylcnDrawerClose, DrawerContent as SkylcnDrawerContent, DrawerTrigger as SkylcnDrawerTrigger,
} from "@skylab-kulubu/skylcn-ui";

export function Drawer({ open, defaultOpen = false, onOpenChange, children }) {
  return (
    <SkylcnDrawer open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
      {children}
    </SkylcnDrawer>
  );
}

export function DrawerTrigger({ asChild = false, children, ...props }) {
  if (asChild && isValidElement(children)) return <SkylcnDrawerTrigger render={children} {...props} />;
  return <SkylcnDrawerTrigger {...props}>{children}</SkylcnDrawerTrigger>;
}

export function DrawerClose({ asChild = false, children, ...props }) {
  if (asChild && isValidElement(children)) return <SkylcnDrawerClose render={children} {...props} />;
  return <SkylcnDrawerClose {...props}>{children}</SkylcnDrawerClose>;
}

export function DrawerContent({ children, className = "", ...props }) {
  // An anchor without a box, so the scoped drawer covers the nearest positioned ancestor as forms' did
  const [container, setContainer] = useState(null);

  return (
    <>
      <div ref={setContainer} className="contents" />
      {container ? (
        <SkylcnDrawerContent container={container} className={className} {...props}>
          {children}
        </SkylcnDrawerContent>
      ) : null}
    </>
  );
}
