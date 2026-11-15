"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, ChartColumn, Database, FilePlus, FileText, LayoutDashboard, LayoutTemplate, List, LogOut, Mail, PencilLine, Plus, ShieldCheck, UserX, Workflow } from "lucide-react";
import {
  AppShell, AppShellFill, MenuItem, MenuLabel, MenuSeparator, SidebarBrand, SidebarContent, SidebarFooter, SidebarGroup, SidebarItem,
  SidebarSection, SidebarUser, TooltipProvider, useTheme,
} from "@skylab-kulubu/skylcn-ui";
import { logout } from "@/lib/authActions";
import { CLUB_CONSOLES } from "@/lib/club-switcher";
import ThemeToggle from "@/app/components/ThemeToggle";
import { useFormContext, useTemplateContext, useWorkflowContext } from "../providers";
import Breadcrumbs from "./Breadcrumbs";

const CONSOLE_ICONS = { admin: ShieldCheck, forms: FileText, mail: Mail };
const CONSOLES = CLUB_CONSOLES.map((app) => ({ ...app, icon: CONSOLE_ICONS[app.id] }));

const breadcrumbLabels = {
  "/admin": "Dashboard",
  "/admin/forms": "Formlar",
  "/admin/forms/all": "Veritabanı",
  "/admin/forms/new-form": "Yeni Form",
  "/admin/how-to-use": "Nasıl Kullanılır",
  "/admin/templates": "Şablonlar",
  "/admin/templates/new-template": "Yeni Şablon",
  "/admin/workflows": "Akışlar",
  "/admin/ownership": "Sahipsiz içerikler",
};

function getRoleLabel(roles = []) {
  if (roles.some((r) => (r ?? "").toLowerCase().includes("admin"))) return "AÇMACILAB";
  for (const role of roles) {
    const n = (role ?? "").toLowerCase();
    if (n.includes("yk"))       return "YÖNETİM";
    if (n.includes("dk"))       return "DENETİM";
    if (n.includes("weblab"))   return "WEBLAB";
    if (n.includes("skysec"))   return "SKYSEC";
    if (n.includes("mobilab"))  return "MOBİLAB";
    if (n.includes("airlab"))   return "AIRLAB";
    if (n.includes("algolab"))  return "ALGOLAB";
    if (n.includes("gamelab"))  return "GAMELAB";
    if (n.includes("chainlab")) return "YAŞIYONUZ MU";
    if (n.includes("skysis"))   return "YAŞIYONUZ MU";
  }
  return "KULLANICI";
}

const isActive = (item, pathname) => item.href === pathname || Boolean(item.children?.some((child) => isActive(child, pathname)));

function NavItems({ items, pathname }) {
  return items.map((item) => (
    <SidebarItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item, pathname)}>
      {item.children?.length ? <NavItems items={item.children} pathname={pathname} /> : null}
    </SidebarItem>
  ));
}

function NavGroup({ icon, label, items, pathname }) {
  return (
    <SidebarGroup icon={icon} label={label} active={items.some((item) => isActive(item, pathname))}>
      <NavItems items={items} pathname={pathname} />
    </SidebarGroup>
  );
}

function Account({ user, roles, status, theme, onThemeChange }) {
  // Holds the row's height while the session loads, so the footer does not jump
  if (status === "loading") return <div aria-hidden="true" className="h-11" />;

  const contact = user?.email?.trim() || user?.username?.trim() || "";
  const imageUrl = user?.profilePictureUrl?.trim() || user?.image?.trim() || "";
  const displayName = user?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/)
    .map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR")))
    .join(" ") || "Kullanıcı";

  return (
    <SidebarUser name={displayName} email={contact || null} subtitle={getRoleLabel(roles)} avatarSrc={imageUrl || null}
      menu={
        <>
          {contact ? <MenuLabel>{contact}</MenuLabel> : null}
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          <MenuSeparator />
          <MenuItem icon={LogOut} destructive onClick={() => logout({ callbackUrl: window.location.origin })}>Çıkış yap</MenuItem>
        </>
      }
    />
  );
}

/** The admin navigation as AppShell's sidebar: what a person sees follows their roles and the open form or flow. */
export function AdminSidebar({ pathname, user, status, realmRoles = [], skyformsRoles = [], formId, form, formLoading, workflowId, workflow, workflowLoading, theme, onThemeChange }) {
  const isSuperAdmin = skyformsRoles.includes("skyforms:*");
  const canViewResponses = form?.access?.canViewResponses ?? Number(form?.userRole) >= 1;
  const canEditForm = form?.access?.canEdit ?? Number(form?.userRole) >= 2;

  const activeFormItem = formId
    ? {
        href: `/admin/forms/${formId}`,
        icon: FileText,
        label: formLoading ? "..." : (form?.title?.trim() || "..."),
        children: [
          ...(canViewResponses ? [{ href: `/admin/forms/${formId}/responses`, icon: List, label: "Cevaplar" }] : []),
          ...(canViewResponses ? [{ href: `/admin/forms/${formId}/analytics`, icon: ChartColumn, label: "Analitik" }] : []),
          ...(canEditForm ? [{ href: `/admin/forms/${formId}/edit`, icon: PencilLine, label: "Düzenle" }] : []),
        ],
      }
    : null;

  const activeWorkflowItem = workflowId
    ? { href: `/admin/workflows/${workflowId}`, icon: Workflow, label: workflowLoading ? "..." : (workflow?.name?.trim() || "...") }
    : null;

  return (
    <>
      <SidebarBrand eyebrow="SKY LAB" name="Forms" consoles={CONSOLES} current="forms" />
      <SidebarContent>
        <SidebarSection>
          <SidebarItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === "/admin"} />
        </SidebarSection>

        <SidebarSection label="Platform">
          <NavGroup icon={FileText} label="Formlar" pathname={pathname}
            items={[
              { href: "/admin/forms/new-form", icon: FilePlus, label: "Yeni Form" },
              { href: "/admin/forms", icon: List, label: "Formları Görüntüle" },
              ...(activeFormItem ? [activeFormItem] : []),
            ]}
          />
          <NavGroup icon={Workflow} label="Akışlar" pathname={pathname}
            items={[
              { href: "/admin/workflows", icon: List, label: "Akışları Görüntüle" },
              ...(activeWorkflowItem ? [activeWorkflowItem] : []),
            ]}
          />
          <NavGroup icon={LayoutTemplate} label="Şablonlar" pathname={pathname}
            items={[
              { href: "/admin/templates/new-template", icon: Plus, label: "Yeni Şablon" },
              { href: "/admin/templates", icon: List, label: "Şablonları Görüntüle" },
            ]}
          />
        </SidebarSection>

        {isSuperAdmin ? (
          <SidebarSection label="Yönetim">
            <SidebarItem href="/admin/forms/all" icon={Database} label="Veritabanı" active={pathname === "/admin/forms/all"} />
            <SidebarItem href="/admin/ownership" icon={UserX} label="Sahipsiz içerikler" active={pathname === "/admin/ownership"} />
          </SidebarSection>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarItem href="/admin/how-to-use" icon={BookOpen} label="Nasıl Kullanılır" active={pathname === "/admin/how-to-use"} />
        <Account user={user} roles={realmRoles.filter(Boolean)} status={status} theme={theme} onThemeChange={onThemeChange} />
      </SidebarFooter>
    </>
  );
}

export default function Sidebar({ user, children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const resolvedUser = user ?? session?.user;

  const { formId, form, loading: formLoading } = useFormContext();
  const { workflowId, workflow, loading: workflowLoading } = useWorkflowContext();
  const { title: templateTitle } = useTemplateContext();

  const dynamicBreadcrumbLabels = useMemo(() => {
    let labels = breadcrumbLabels;

    if (pathname?.startsWith("/admin/templates/") && templateTitle) {
      labels = { ...labels, [pathname]: templateTitle };
    }

    if (formId) {
      const title = (form?.title || "...").trim();
      labels = {
        ...labels,
        [`/admin/forms/${formId}`]: formLoading ? "..." : title,
        [`/admin/forms/${formId}/edit`]: "Düzenleme",
        [`/admin/forms/${formId}/responses`]: "Cevaplar",
        [`/admin/forms/${formId}/analytics`]: "Analitik",
        [`/admin/forms/${formId}/responses/:responseId`]: "Cevap",
      };
    }

    if (workflowId) {
      labels = {
        ...labels,
        [`/admin/workflows/${workflowId}`]: workflowLoading ? "..." : (workflow?.name?.trim() || "..."),
      };
    }

    return labels;
  }, [formId, form?.title, formLoading, workflowId, workflow?.name, workflowLoading, pathname, templateTitle]);

  return (
    <TooltipProvider>
      <AppShell
        header={<Breadcrumbs labels={dynamicBreadcrumbLabels} />}
        sidebar={
          <AdminSidebar pathname={pathname} user={resolvedUser} status={status} realmRoles={session?.realmRoles ?? []} skyformsRoles={session?.skyformsRoles ?? []}
            formId={formId} form={form} formLoading={formLoading} workflowId={workflowId} workflow={workflow} workflowLoading={workflowLoading}
            theme={theme} onThemeChange={setTheme}
          />
        }
      >
        {/* forms' pages pad themselves and size to the panel (h-[calc(100dvh-3.5rem)]), so they get all of it */}
        <AppShellFill className="-m-4 gap-0 sm:-m-6 md:h-[calc(100%+3rem)] md:overflow-hidden">{children}</AppShellFill>
      </AppShell>
    </TooltipProvider>
  );
}
