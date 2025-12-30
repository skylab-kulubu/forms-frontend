"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import { LayoutDashboard, Menu, X, ChevronDown, ChevronRight, Settings, FilePlus, FileText, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SectionLabel({ children }) {
  return (
    <div className="px-2 text-xs font-medium text-neutral-400 tracking-wide select-none">
      {children}
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, onClick, variant = "default" }) {
  const base = "group flex items-center gap-3 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5";
  const defaultState = active ? "bg-neutral-800 text-neutral-200 px-3 py-2" : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100 px-3 py-2";
  const subtleState = active ? "text-neutral-100 text-xs px-2 py-1" : "text-neutral-400 hover:text-neutral-100 text-xs px-2 py-1";
  const state = variant === "subtle" ? subtleState : defaultState;

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${base} ${state}`} onClick={onClick}>
      <Icon className={`${variant === "subtle" ? "h-4 w-4" : "h-5 w-5"} text-neutral-300 group-hover:text-neutral-200`} strokeWidth={1.75} />
      <span className="font-medium truncate">{label}</span>
      {variant !== "subtle" && (
        <ChevronRight className="ml-auto h-4 w-4 text-neutral-400 group-hover:text-neutral-200" />
      )}
    </Link>
  );
}

function NavGroup({ icon: Icon, label, items = [], pathname, onItemClick }) {
  const hasActive = items.some((i) => i.href === pathname);
  const [open, setOpen] = useState(hasActive);

  const base = "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5";
  const state = "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100";

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-expanded={open}
        className={`${base} ${state} w-full text-left`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon className="h-5 w-5 text-neutral-300 group-hover:text-neutral-200" strokeWidth={1.75} />
        <span className="font-medium truncate">{label}</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="nav-group" className="pl-4 ml-5 space-y-1 border-l-3 border-neutral-800/80 overflow-hidden"
            initial="collapsed" 
            animate="open"
            exit="collapsed"
            variants={{
              open: {
                height: "auto",
                opacity: 1,
                transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.04, delayChildren: 0.03 },
              },
              collapsed: {
                height: 0,
                opacity: 0,
                transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.03, staggerDirection: -1 },
              },
            }}
          >
            {items.map((item) => (
              <motion.div key={item.href}
                variants={{ open: { opacity: 1, x: 0 }, collapsed: { opacity: 0, x: -6 } }}
                transition={{ duration: 0.15 }}
              >
                <NavItem href={item.href} icon={item.icon} label={item.label} active={pathname === item.href} variant="subtle" onClick={onItemClick} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ user, pathname, onItemClick }) {

  const u = user ?? {
    name: "Skylab K",
    subtitle: "skylab@std.yildiz.edu",
    initials: "SK",
    imageUrl: null,
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-lg bg-neutral-700 text-white grid place-items-center text-sm font-medium overflow-hidden">
          {u.imageUrl ? (
            <img src={u.imageUrl} alt={u.name} className="h-full w-full object-cover" />
          ) : (
            <span>{u.initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100 truncate">{u.name}</p>
          <p className="text-xs text-neutral-500 truncate">{u.subtitle}</p>
        </div>
        <Settings className="ml-auto h-4 w-4 text-zinc-400" />
      </div>

      <div className="space-y-2">
        
        <div className="space-y-1">
          <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === "/admin"} onClick={onItemClick} />
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Platform</SectionLabel>
        <NavGroup
          icon={FileText}
          label="Formlar"
          pathname={pathname}
          onItemClick={onItemClick}
          items={[
            { href: "/admin/forms/new-form", icon: FilePlus, label: "Yeni Form" },
            { href: "/admin/forms", icon: List, label: "Formları Görüntüle" },
          ]}
        />
      </div>

      <div className="mt-auto px-1 text-[10px] text-zinc-400 select-none">v0.1</div>
    </div>
  );
}

export default function Sidebar({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  return (
    <div className="min-h-screen md:pl-72">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 shrink-0 border-r border-neutral-950/70 bg-neutral-950/40 backdrop-blur-lg shadow-md">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Desktop top bar */}
      <div className="hidden md:block sticky top-0 z-30 backdrop-blur">
        <div className="flex h-14 items-center px-6">
          <Breadcrumbs labels={{ "/admin": "Dashboard", "/admin/forms/new-form": "Yeni Form", "/admin/forms": "Formlar" }} />
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-neutral-950/70 bg-neutral-950/40 backdrop-blur">
        <div className="flex h-14 items-center px-3">
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-200 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-2 min-w-0 flex-1">
            <Breadcrumbs labels={{ "/admin": "Dashboard", "/admin/forms/new-form": "Yeni Form", "/admin/forms": "Formlar" }} />
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden ${open ? "fixed" : "hidden"} inset-0 z-50`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div ref={panelRef} className={`absolute inset-y-0 left-0 w-72 backdrop-blu border-r border-neutral-950/70 bg-neutral-950/90 shadow-xl transition-transform duration-200 
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent user={user} pathname={pathname} onItemClick={() => setOpen(false)} />
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}