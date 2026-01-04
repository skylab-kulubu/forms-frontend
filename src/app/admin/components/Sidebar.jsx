"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useFormContext } from "../providers";
import Breadcrumbs from "./Breadcrumbs";
import { LayoutDashboard, Menu, ChevronDown, ChevronRight, LogOut, FilePlus, FileText, List, PencilLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const breadcrumbLabels = {
  "/admin": "Dashboard",
  "/admin/forms": "Formlar",
  "/admin/forms/new-form": "Yeni Form"
};

function SectionLabel({ children }) {
  return (
    <div className="px-2 text-xs font-medium text-neutral-400 tracking-wide select-none">
      {children}
    </div>
  );
}

function getInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  const itemIsActive = (item) => {
    if (!item) return false;
    if (item.href === pathname) return true;
    if (!item.children?.length) return false;
    return item.children.some((child) => itemIsActive(child));
  };

  const hasActive = items.some((item) => itemIsActive(item));
  const [open, setOpen] = useState(hasActive);

  const base = "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5";
  const state = "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100";

  return (
    <div className="space-y-1">
      <button type="button" aria-expanded={open}
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
              open: { height: "auto", opacity: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.04, delayChildren: 0.03 } },
              collapsed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.03, staggerDirection: -1 } },
            }}
          >
            {items.map((item) => (
              <motion.div key={item.href}
                variants={{ open: { opacity: 1, x: 0 }, collapsed: { opacity: 0, x: -6 } }}
                transition={{ duration: 0.15 }}
              >
                <NavItem
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={itemIsActive(item)}
                  variant="subtle"
                  onClick={onItemClick}
                />
                {item.children?.length ? (
                  <div className="mt-1 ml-3 space-y-1 border-l border-neutral-800/60 pl-3">
                    {item.children.map((child) => (
                      <div key={child.href}>
                        <NavItem
                          href={child.href}
                          icon={child.icon}
                          label={child.label}
                          active={itemIsActive(child)}
                          variant="subtle"
                          onClick={onItemClick}
                        />
                        {child.children?.length ? (
                          <div className="mt-1 ml-3 space-y-1 border-l border-neutral-800/60 pl-3">
                            {child.children.map((grandChild) => (
                              <NavItem
                                key={grandChild.href}
                                href={grandChild.href}
                                icon={grandChild.icon}
                                label={grandChild.label}
                                active={itemIsActive(grandChild)}
                                variant="subtle"
                                onClick={onItemClick}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ user, pathname, onItemClick, status, formId, form, formLoading }) {
  const subtitle = user?.email?.trim() || user?.username?.trim() || "--";
  const imageUrl = user?.profilePictureUrl?.trim() || user?.image?.trim() || "";
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];

  const displayName = user?.fullName.trim().toLocaleLowerCase("tr-TR").split(/\s+/)
    .map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR")))
    .join(" ") || "Kullanıcı";

  const initials = getInitials(displayName, subtitle);

  const handleLogout = async () => {
    const logoutRedirectUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    signOut({ callbackUrl: logoutRedirectUrl });
  };

  const activeFormLabel = formLoading ? "..." : (form?.title?.trim() || "...");

  const activeFormItem = formId
  ? {
      href: `/admin/forms/${formId}`,
      icon: FileText,
      label: activeFormLabel,
      children: [
        { href: `/admin/forms/${formId}/responses`, icon: List, label: "Cevaplar" },
        { href: `/admin/forms/${formId}/edit`, icon: PencilLine, label: "Düzenle" },
      ],
    }
  : null;

  return (
    <div className="flex h-full w-full flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-lg bg-neutral-800 border border-white/10 text-white grid place-items-center text-sm font-medium overflow-hidden">
          {status === "loading" ? null
            : imageUrl ? (
              <motion.img
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                src={imageUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>{initials}</motion.span>
            )}
        </div>
        {status === "loading" ? null : (
          <>
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
              className="min-w-0"
            >
              <p className="text-sm font-semibold text-neutral-100 truncate">{displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
            </motion.div>
            <motion.button type="button" onClick={handleLogout}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="rounded-lg bg-transparent text-xs py-1  ml-auto font-semibold text-neutral-500 transition hover:text-indigo-300"
            >
              <LogOut size={16} />
            </motion.button>
          </>
        )}
      </div>

      <div className="w-full rounded-md text-center border border-white/8 bg-white/3 px-2 py-1 text-[11px] text-neutral-200">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 1.2 }}>{roles.length ? roles[0] : "--"}</motion.span>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === "/admin"} onClick={onItemClick} />
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Platform</SectionLabel>
        <NavGroup icon={FileText} label="Formlar"
          pathname={pathname} onItemClick={onItemClick}
          items={[
            { href: "/admin/forms/new-form", icon: FilePlus, label: "Yeni Form" },
            {
              href: "/admin/forms",
              icon: List,
              label: "Formları Görüntüle"
            },
            ...(activeFormItem ? [activeFormItem] : []),
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
  const { data: session, status } = useSession();
  const resolvedUser = user ?? session?.user;

  const { formId, form, loading: formLoading } = useFormContext();

  const dynamicBreadcrumbLabels = useMemo(() => {
    const base = breadcrumbLabels;

    if (!formId) return base;

    const title = (form?.title || "...").trim();

    return {
      ...base,
      [`/admin/forms/${formId}`]: formLoading ? "..." : title,
      [`/admin/forms/${formId}/edit`]: "Düzenleme",
      [`/admin/forms/${formId}/responses`]: "Cevaplar",
    };
  }, [formId, form?.title, formLoading]);

  return (
    <div className="min-h-screen md:pl-72">

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 shrink-0 border-r border-neutral-950/70 bg-neutral-950/40 backdrop-blur-lg shadow-md">
        <SidebarContent user={resolvedUser} pathname={pathname} status={status} formId={formId} form={form} formLoading={formLoading} />
      </aside>

      <div className="hidden md:block sticky top-0 z-30 backdrop-blur">
        <div className="flex h-14 items-center px-6">
          <Breadcrumbs labels={dynamicBreadcrumbLabels} />
        </div>
      </div>

      <div className="md:hidden sticky top-0 z-40 border-b border-neutral-950/70 bg-neutral-950/40 backdrop-blur">
        <div className="flex h-14 items-center px-3">
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-200 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-2 min-w-0 flex-1">
            <Breadcrumbs labels={dynamicBreadcrumbLabels} />
          </div>
        </div>
      </div>

      <div className={`md:hidden ${open ? "fixed" : "hidden"} inset-0 z-50`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div ref={panelRef} className={`absolute inset-y-0 left-0 w-72 backdrop-blu border-r border-neutral-950/70 bg-neutral-950/90 shadow-xl transition-transform duration-200 
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent user={resolvedUser} pathname={pathname} status={status} formId={formId} form={form} formLoading={formLoading} onItemClick={() => setOpen(false)} />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}