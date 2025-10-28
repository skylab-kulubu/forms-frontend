"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, X, ChevronDown, ChevronRight, Settings } from "lucide-react";

function SectionLabel({ children }) {
  return (
    <div className="px-2 text-xs font-medium text-zinc-500 tracking-wide select-none">
      {children}
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, onClick }) {
  const base = "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5";
  const state = active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900";

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${base} ${state}`} onClick={onClick}>
      <Icon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-900" strokeWidth={1.75} />
      <span className="font-medium truncate">{label}</span>
      <ChevronRight className="ml-auto h-4 w-4 text-zinc-300 group-hover:text-zinc-500" />
    </Link>
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
        <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white grid place-items-center text-sm font-medium overflow-hidden">
          {u.imageUrl ? (
            <img src={u.imageUrl} alt={u.name} className="h-full w-full object-cover" />
          ) : (
            <span>{u.initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{u.name}</p>
          <p className="text-xs text-zinc-500 truncate">{u.subtitle}</p>
        </div>
        <Settings className="ml-auto h-4 w-4 text-zinc-400" />
      </div>

      <div className="space-y-2">
        <SectionLabel>Platform</SectionLabel>
        <div className="space-y-1">
          <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === "/admin"} onClick={onItemClick} />
        </div>
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
    <div className="min-h-screen bg-white md:pl-72">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 shrink-0 border-r border-zinc-200/70 bg-neutral-100/40 backdrop-blur-lg shadow-md">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="flex h-14 items-center px-3">
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-2 text-sm font-semibold">Breadcrumbs eklencek buraya</div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden ${open ? "fixed" : "hidden"} inset-0 z-50`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div ref={panelRef} className={`absolute inset-y-0 left-0 w-72 bg-white/60 backdrop-blu border-r border-zinc-200/70 shadow-xl transition-transform duration-200 
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-3">
            <div className="text-sm font-semibold">Menu</div>
            <button onClick={() => setOpen(false)} className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5">
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent user={user} pathname={pathname} onItemClick={() => setOpen(false)} />
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}